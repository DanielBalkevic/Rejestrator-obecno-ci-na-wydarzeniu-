/* tests.js — 8 testów automatycznych. Node: `node tests.js`; w przeglądarce ładowany przez index.html. */
(function(){
const L=typeof module!=='undefined'?require('./logic.js'):ASD;
const {validate,act,sumFor,insertionSort,ranking,summary,control,gen,same,fresh}=L;
const TESTS=[
 ['Przykład kontrolny',()=>{const s=control(),st={checked:0,cmp:0},r=ranking(s,st),m=summary(s);
   return r.map(x=>x.id).join('')==='BAC'&&r[0].total===60&&r[1].total===50&&r[2].total===0&&r[2].open===690&&m.distinct===3&&m.now===1&&m.minutes===110}],
 ['Ponowne wejście A odrzucone bez zapisu',()=>{const s=control();s.visits=[{pid:'A',in:600,out:null}];const b=JSON.stringify(s),r=act(s,'in','A',610);return!r.ok&&JSON.stringify(s)===b}],
 ['Wyjście wcześniejsze od wejścia odrzucone',()=>{const s=control();s.visits=[{pid:'A',in:650,out:null}];return!act(s,'out','A',640).ok&&act(s,'out','A',650).ok}],
 ['Remis → kolejność wg ID',()=>{const a=[{id:'Q',total:5},{id:'C',total:5},{id:'F',total:9}];insertionSort(a,{cmp:0});return a.map(x=>x.id).join('')==='FCQ'}],
 ['Otwarte wejście nie zwiększa sumy',()=>{const r=sumFor([{pid:'C',in:690,out:null}],'C',{checked:0});return r.total===0&&r.open===690}],
 ['Pusta lista: brak błędu',()=>{const s=fresh(),m=summary(s);return ranking(s,{checked:0,cmp:0}).length===0&&m.distinct===0&&m.now===0&&m.minutes===0}],
 ['Eksport/import odtwarza wynik; błędny plik odrzucony',()=>{const s=control(),back=JSON.parse(JSON.stringify(s));
   const a=ranking(s,{checked:0,cmp:0}).map(x=>x.id+x.total).join(),b=ranking(back,{checked:0,cmp:0}).map(x=>x.id+x.total).join();
   const bad=JSON.parse(JSON.stringify(s));bad.visits[0].pid='NIE';return validate(back)===null&&a===b&&validate(bad)!==null}],
 ['Własne sortowanie zgodne ze wzorcem (uporządkowane, odwrócone, losowe)',()=>['sorted','rev','rand'].every(m=>{const g=gen(100,m);insertionSort(g.a,{cmp:0});return same(g.a,g.ref)})]
];
if(typeof module!=='undefined'){let ok=0;TESTS.forEach(([n,f],i)=>{let p=false;try{p=f()===true}catch(e){}ok+=p;console.log((p?'PASS ':'FAIL ')+(i+1)+'. '+n)});console.log(ok+'/'+TESTS.length);process.exit(ok===TESTS.length?0:1)}else window.TESTS=TESTS;
})();
