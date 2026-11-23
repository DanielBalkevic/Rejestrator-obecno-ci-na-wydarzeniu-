/* logic.js — czysta logika (bez DOM): walidacja, operacje, własne algorytmy ASD I.
   Działa w przeglądarce (index.html) i w Node (tests.js). */
const pad=n=>String(n).padStart(2,'0');
const ft=m=>pad(Math.floor(m/60))+':'+pad(m%60);           // minuty -> HH:MM
function pt(s){const m=/^(\d{1,2}):(\d{2})$/.exec(String(s).trim());if(!m)return null;const h=+m[1],i=+m[2];return h<24&&i<60?h*60+i:null}
const ID_RE=/^[A-Za-z0-9-]{1,20}$/;
const fresh=()=>({version:1,event:{id:'EV-1',name:'Wydarzenie',date:'2026-11-25',start:600,end:720},people:[],visits:[]});
/* ===== Walidacja całego stanu (używana też przez import) ===== */
function validate(o){
  if(!o||o.version!==1)return'Nieznana wersja formatu (wymagana 1).';
  const e=o.event;if(!e||typeof e.id!=='string'||!ID_RE.test(e.id)||typeof e.name!=='string'||!e.name.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')||!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end>1439||e.start>=e.end)return'Błędne dane wydarzenia.';
  if(!Array.isArray(o.people)||!Array.isArray(o.visits))return'Brak list uczestników/wizyt.';
  if(o.people.length>1000||o.visits.length>1000)return'Przekroczono limit 1000 rekordów.';
  const ids=new Set();
  for(const p of o.people){if(!p||typeof p.id!=='string'||!ID_RE.test(p.id)||typeof p.name!=='string'||!p.name.trim())return'Błędny uczestnik.';if(ids.has(p.id))return'Zduplikowane ID: '+p.id;ids.add(p.id)}
  const last=new Map(),open=new Set();   // last = koniec poprzedniej wizyty osoby
  for(const v of o.visits){
    if(!v||!ids.has(v.pid))return'Wizyta nieznanego uczestnika.';
    if(!Number.isInteger(v.in)||v.in<e.start||v.in>e.end)return'Wejście poza czasem wydarzenia.';
    if(open.has(v.pid))return'Wizyta po otwartej wizycie (brak wyjścia): '+v.pid;
    if(last.has(v.pid)&&v.in<last.get(v.pid))return'Nakładające się wizyty: '+v.pid;
    if(v.out===null)open.add(v.pid);
    else if(!Number.isInteger(v.out)||v.out<v.in||v.out>e.end)return'Błędne wyjście u '+v.pid;
    else last.set(v.pid,v.out);
  }
  return null;
}

/* ===== Operacje: pracują na kopii, stan zmienia się dopiero po sukcesie ===== */
function act(st,type,a,b){
  const c=JSON.parse(JSON.stringify(st));
  if(type==='event'){c.event=a;const r=validate(c);return r?{ok:false,err:r}:{ok:true,state:c}}
  if(type==='person'){
    if(!ID_RE.test(a))return{ok:false,err:'ID: tylko A–Z, cyfry i łącznik (max 20).'};
    if(!String(b).trim())return{ok:false,err:'Nazwa nie może być pusta.'};
    if(c.people.some(p=>p.id===a))return{ok:false,err:'ID już istnieje.'};
    if(c.people.length>=1000)return{ok:false,err:'Limit 1000 uczestników.'};
    c.people.push({id:a,name:String(b).trim()});return{ok:true,state:c}}
  // a = ID osoby, b = czas w minutach
  if(!c.people.some(p=>p.id===a))return{ok:false,err:'Nie ma takiego uczestnika.'};
  if(!Number.isInteger(b))return{ok:false,err:'Nieprawidłowy czas (HH:MM).'};
  if(b<c.event.start||b>c.event.end)return{ok:false,err:'Czas poza wydarzeniem '+ft(c.event.start)+'–'+ft(c.event.end)+'.'};
  const mine=c.visits.filter(v=>v.pid===a),open=mine.find(v=>v.out===null);
  if(type==='in'){
    if(open)return{ok:false,err:'Uczestnik już jest w środku — najpierw wyjście.'};
    if(c.visits.length>=1000)return{ok:false,err:'Limit 1000 wizyt.'};
    if(mine.some(v=>b<v.out))return{ok:false,err:'Wejście wcześniejsze niż poprzednie wyjście.'};
    c.visits.push({pid:a,in:b,out:null});return{ok:true,state:c}}
  if(!open)return{ok:false,err:'Wyjście bez aktywnej wizyty.'};
  if(b<open.in)return{ok:false,err:'Wyjście wcześniejsze niż wejście ('+ft(open.in)+').'};
  open.out=b;return{ok:true,state:c};
}

/* ===== Własne algorytmy ASD I =====
   Lista rekordów = zwykła tablica. st = liczniki {checked, cmp}. */
// Wyszukiwanie liniowe: WSZYSTKIE dopasowania (ID równe LUB nazwa zawiera fragment).
// Pętla zawsze przechodzi całą listę, więc checked = n (licznik odpowiada pętli).
function findPeople(people,q,st){
  q=q.trim().toLowerCase();const r=[];
  for(let i=0;i<people.length;i++){
    st.checked++;st.cmp++;                      // porównanie klucza: ID
    if(people[i].id.toLowerCase()===q){r.push(people[i]);continue}
    st.cmp++;                                   // porównanie klucza: nazwa
    if(people[i].name.toLowerCase().includes(q))r.push(people[i]);
  }
  return r;
}
// Liniowy odczyt wizyt osoby i sumowanie zamkniętych; otwarta NIE wchodzi do sumy.
function sumFor(visits,pid,st){
  let total=0,open=null;const parts=[];
  for(let i=0;i<visits.length;i++){
    st.checked++;const v=visits[i];
    if(v.pid!==pid)continue;
    if(v.out===null)open=v.in;else{total+=v.out-v.in;parts.push({in:v.in,out:v.out,len:v.out-v.in})}
  }
  return{total,parts,open};
}
// Warunek porównania: większa suma pierwsza, przy remisie mniejsze ID.
const before=(x,y)=>x.total>y.total||(x.total===y.total&&x.id<y.id);
// Sortowanie przez wstawianie (stabilne, O(n^2) w najgorszym, O(n) dla uporządkowanych).
function insertionSort(a,st,trace){
  const txt=()=>a.map(x=>x.id+':'+x.total).join(' ');
  for(let i=1;i<a.length;i++){
    const key=a[i],b0=trace?txt():'';let j=i-1;
    while(j>=0){st.cmp++;if(before(key,a[j])){a[j+1]=a[j];j--}else break}
    a[j+1]=key;
    if(trace)trace.push({b:b0,d:key.id+' → pozycja '+(j+2),a:txt()});
  }
  return a;
}
function ranking(s,st,trace){
  const rows=s.people.map(p=>{const r=sumFor(s.visits,p.id,st);return{id:p.id,name:p.name,...r}});
  return insertionSort(rows,st,trace);
}
function summary(s){
  const seen=new Set(s.visits.map(v=>v.pid));
  return{distinct:seen.size,now:s.visits.filter(v=>v.out===null).length,minutes:s.visits.reduce((t,v)=>t+(v.out===null?0:v.out-v.in),0)};
}

/* ===== Dane testowe ===== */
function control(){return{version:1,event:{id:'EV-1',name:'Dzień Filii',date:'2026-11-25',start:600,end:720},
  people:[{id:'A',name:'Anna'},{id:'B',name:'Bartek'},{id:'C',name:'Celina'}],
  visits:[{pid:'A',in:600,out:630},{pid:'B',in:610,out:670},{pid:'A',in:660,out:680},{pid:'C',in:690,out:null}]}}
function lcg(seed){let x=seed;return()=>(x=(x*1103515245+12345)%2147483648)/2147483648} // powtarzalne dane
function big(n){const r=lcg(7),s=fresh();
  for(let i=1;i<=n;i++){s.people.push({id:'P'+String(i).padStart(3,'0'),name:'Osoba '+i});
    let t=600+Math.floor(r()*30);const k=1+Math.floor(r()*3);
    for(let j=0;j<k&&t<700;j++){const o=t+5+Math.floor(r()*30);if(o>720)break;s.visits.push({pid:'P'+String(i).padStart(3,'0'),in:t,out:o});t=o+3+Math.floor(r()*10)}}
  return s}

function gen(n,mode){const r=lcg(n),a=[];for(let i=0;i<n;i++)a.push({id:'P'+String(i).padStart(4,'0'),total:Math.floor(r()*500)});
  const ref=[...a].sort((x,y)=>y.total-x.total||(x.id<y.id?-1:1)); // niezależny wzorzec
  if(mode==='sorted')return{a:[...ref],ref};if(mode==='rev')return{a:[...ref].reverse(),ref};return{a,ref}}
const same=(x,y)=>x.length===y.length&&x.every((v,i)=>v.id===y[i].id);

const ASD={validate,act,findPeople,sumFor,before,insertionSort,ranking,summary,control,lcg,big,gen,same,ft,pt,fresh,ID_RE};
if(typeof module!=='undefined')module.exports=ASD;
