# ASD1-M2-01 — Rejestrator obecności na wydarzeniu

Autor: **Daniel Balkevic**, indeks **94035** · Algorytmy i struktury danych I · Mini-projekt M2 · 2026/2027

Aplikacja pomaga organizatorowi sprawdzić, kto przyszedł na wydarzenie i jak długo był obecny. Działa lokalnie, bez kont, API i wdrożenia.

## Uruchomienie
- **Aplikacja:** otwórz `index.html` w przeglądarce (logika i testy są w nim wbudowane, plik działa samodzielnie; `logic.js` i `tests.js` służą do uruchamiania testów w Node).
- **Testy (Node ≥ 16):** `node tests.js` → 8 przypadków, kod wyjścia 0 gdy wszystkie zaliczone.
- **Testy w przeglądarce:** przycisk „Uruchom testy” w sekcji 7.
- Brak zależności do instalacji.

## Pliki
| Plik | Zawartość |
|---|---|
| `logic.js` | walidacja, operacje wejście/wyjście, własne algorytmy, dane testowe |
| `index.html` | interfejs (HTML/CSS/JS), eksport/import JSON, porównania |
| `tests.js` | 8 testów automatycznych |

## Model danych
Czas = całkowite minuty od północy. Wydarzenie `{id,name,date,start,end}`, uczestnik `{id,name}`, wizyta `{pid,in,out|null}`. Limit 1000 rekordów każdego rodzaju. Format JSON ma pole `version: 1`.

## Własne algorytmy (ASD I)
- **Wyszukiwanie liniowe** `findPeople` — wszystkie dopasowania (ID równe lub nazwa zawiera fragment), O(n); licznik rekordów = n.
- **Sumowanie czasu** `sumFor` — liniowy odczyt listy wizyt, O(m); wizyta bez wyjścia jest „otwarta” i nie liczy się do sumy.
- **Sortowanie przez wstawianie** `insertionSort` — suma minut malejąco, przy remisie ID rosnąco; O(n) dla danych uporządkowanych, O(n²) dla odwróconych. Dla ≤ 8 osób pokazuje tabelę „przed → decyzja → po”.
- Wbudowane `sort` służy tylko jako niezależny wzorzec w testach i porównaniu.

## Przykład kontrolny
Wydarzenie 10:00–12:00. A: 10:00–10:30 i 11:00–11:20 = 50; B: 10:10–11:10 = 60; C: wejście 11:30, brak wyjścia = 0 (otwarta). Ranking B, A, C; uczestników 3; obecnych 1; razem 110 min. Przycisk „Przykład kontrolny” wczytuje ten scenariusz.

## Obsługa błędów
Każda operacja działa na kopii stanu i zapisuje się dopiero po pozytywnej walidacji. Import JSON najpierw waliduje cały plik, potem pyta o potwierdzenie; błędny plik nie zmienia bieżących danych. Teksty są wyświetlane jako tekst (escapowanie HTML).

## Wsparcie AI i źródła
Kod został przygotowany z HERMES AI AGENT.
