# 마이리얼트립 제휴 자료 만들기

해카의 제휴 광고(`haeka-ads.js`)와 입장권 온라인 예매 링크(`haeka-book.js`)를 만드는 스크립트.
매달 1일 GitHub 에서 자동으로 돌고(`.github/workflows/mrt-refresh.yml`), 바뀐 게 있으면 저장소에 올린다.

| 파일 | 하는 일 |
|---|---|
| `make-ads.js` | 마이심(나라별 eSIM) 목록을 받아 나라마다 홍보 링크를 만들고 `haeka-ads.js` 를 쓴다 |
| `book-search.js` | 입장권 매장마다 마이리얼트립 상품 후보를 찾는다 |
| `book-match.js` | 후보 중 그 매장의 입장권이 확실한 것만 고른다. 눈으로 확인해 정한 예외는 ACCEPT / REJECT 에 있다 |
| `book-build.js` | 고른 상품의 홍보 링크를 만들어 `haeka-book.js` 를 쓴다 |
| `*-links.json` | 이미 만든 홍보 링크(다시 만들지 않으려고 남겨 둔다) |

API 키는 저장소 Secret `MRT_API_KEY` 에 있다. 코드나 파일에 키를 적지 말 것.
PC 에서 돌릴 때: `MRT_API_KEY_FILE=<키 파일> node tools/mrt/make-ads.js`
