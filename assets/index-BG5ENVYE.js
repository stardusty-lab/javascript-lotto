(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class AppView {
  render() {
    const app2 = document.querySelector("#app");
    const html = `
      <div class="layout">
        <header class="header">
          <h1 class="logo">
            <a href="/">🎱 행운의 로또</a>
          </h1>
        </header>
        <main class="main">
          <section
            id="lotto-game-main"
            class="ui-content-box is-line width-fixed"
          >
            <div class="ui-title shape-main align-center">
              <h1 class="title">🎱 내 번호 당첨 확인 🎱</h1>
            </div>

            <!-- 금액 입력 -->
            <div class="ui-form-group">
              <div class="form-group-title">구입할 금액을 입력해주세요.</div>
              <div class="form-group-content">
                <div class="ui-input is-block" id="price">
                  <input placeholder="금액" />
                </div>
                <button class="ui-button variant-primary" id="buy-button">
                  구입
                </button>
              </div>
            </div>

            <div id="lotto-result-box"></div>

          </section>
        </main>
        <footer class="footer">
          <p class="copy-right">Copyright 2023. woowacourse</p>
        </footer>
      </div>
    `;
    app2.innerHTML = html;
  }
  bindEvent(handler) {
    const buyButton = document.querySelector("#buy-button");
    buyButton.addEventListener("click", () => {
      const priceInput = document.querySelector("#price input");
      const price = priceInput.value;
      handler(price);
    });
  }
}
const Random = {
  randomArray: (startNum, endNum, count) => {
    let randomArray = [];
    for (let i = 0; i < count; i++) {
      const randomNum = startNum + Math.floor(Math.random() * (endNum - startNum + 1));
      if (randomArray.indexOf(randomNum) === -1) randomArray.push(randomNum);
      else i--;
    }
    randomArray.sort((a, b) => a - b);
    return randomArray;
  }
};
const ERROR_MESSAGE = Object.freeze({
  NOT_NUMBER: "숫자가 아닙니다.",
  INVALID_AMOUNT: "1000원 단위가 아닙니다.",
  INVALID_NUMBER_RANGE: "모든 번호는 1부터 45사이의 숫자여야 합니다.",
  MUST_BE_INTEGER: "모든 번호는 정수여야 합니다.",
  INVALID_NUMBER_LENGTH: "로또 번호는 6개의 숫자가 존재하고 콤마로 구분되어야 합니다.",
  MUST_BE_NOT_DUPLICATE: "로또 번호는 중복될 수 없습니다.",
  MUST_BE_NOT_DUPLICATE_WITH_WINNINGNUMBER: "보너스 번호는 당첨 번호와 중복될 수 없습니다."
});
class Validator {
  validatePrice(price) {
    if (isNaN(price)) {
      throw new Error(ERROR_MESSAGE.NOT_NUMBER);
    }
    if (price % 1e3 !== 0 || price <= 0) {
      throw new Error(ERROR_MESSAGE.INVALID_AMOUNT);
    }
  }
  validateLottoNumber(number) {
    if (isNaN(number)) throw new Error(ERROR_MESSAGE.NOT_NUMBER);
    if (!Number.isInteger(number))
      throw new Error(ERROR_MESSAGE.MUST_BE_INTEGER);
    if (number < 1 || number > 45)
      throw new Error(ERROR_MESSAGE.INVALID_NUMBER_RANGE);
  }
  validateLottoNumbers(numbers) {
    numbers.forEach((number) => {
      this.validateLottoNumber(number);
    });
    if (numbers.length !== 6) {
      throw new Error(ERROR_MESSAGE.INVALID_NUMBER_LENGTH);
    }
    const set = new Set(numbers);
    if (set.size !== numbers.length) {
      throw new Error(ERROR_MESSAGE.MUST_BE_NOT_DUPLICATE);
    }
  }
  validateBonusNumber(lottoNumbers, bonusNumber) {
    this.validateLottoNumber(bonusNumber);
    if (lottoNumbers.includes(bonusNumber))
      throw new Error(ERROR_MESSAGE.MUST_BE_NOT_DUPLICATE_WITH_WINNINGNUMBER);
  }
}
class Lotto {
  #validator;
  #numbers;
  constructor(numbers) {
    this.#validator = new Validator();
    this.#validator.validateLottoNumbers(numbers);
    this.#numbers = numbers;
  }
  getNumbers() {
    return [...this.#numbers];
  }
  toString() {
    return `[${this.#numbers.join(", ")}]`;
  }
}
class LottoList {
  #lottos;
  constructor(amount) {
    this.#lottos = this.#createLottoList(amount);
  }
  #createLottoList(amount) {
    const lottos = Array.from({ length: amount }).map(() => {
      return new Lotto(this.#createRandomArray());
    });
    return lottos;
  }
  #createRandomArray() {
    return Random.randomArray(1, 45, 6);
  }
  getLottoList() {
    return this.#lottos;
  }
}
class LottoResultView {
  render({ amount, lottoList }) {
    const lottoResultBox = document.querySelector("#lotto-result-box");
    const html = `
            <!-- 구매한 로또 -->
            <div class="ui-title shape-content">
              <h2 class="title" id="amount-text">총 ${amount}개를 구매하였습니다.</h2>
            </div>
            <ul class="ui-list" id="lotto-list">
            ${lottoList.getLottoList().map((lotto) => {
      const lottoNumbers = lotto.getNumbers();
      return `<li>🎟️ ${lottoNumbers.join(", ")}</li>`;
    }).join("")}
            </ul>


            <!-- 당첨번호, 보너스 번호 입력 -->
            <div class="ui-title shape-content">
              <h2 class="title">
                지난 주 당첨번호 6개와 보너스 번호 1개를 입력해주세요.
              </h2>
            </div>

            <div class="ui-form-cluster">
              <!-- 당첨번호 -->
              <div class="ui-form-group">
                <div class="form-group-title">당첨 번호</div>
                <div class="form-group-content">
                  <div class="ui-pin-root" id="winning-lottos">
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                    <div class="ui-pin">
                      <input placeholder="" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 보너스 번호 -->
              <div class="ui-form-group align-right">
                <div class="form-group-title">보너스 번호</div>
                <div class="form-group-content">
                  <div class="ui-pin-root">
                    <div class="ui-pin" id="bonus-lotto">
                      <input placeholder="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 확인하기 버튼 -->
            <div class="ui-button-box">
              <button
                class="ui-button variant-primary is-block"
                id="result-button"
              >
                결과 확인하기
              </button>
            </div>
    `;
    lottoResultBox.innerHTML = html;
  }
  bindEvent(handler) {
    const resultButton = document.querySelector("#result-button");
    resultButton.addEventListener("click", () => {
      const winningNumbers = [
        ...document.querySelectorAll("#winning-lottos .ui-pin")
      ].map((pinElement) => {
        return pinElement.querySelector("input").value;
      }).map(Number);
      const bonusNumber = document.querySelector("#bonus-lotto input").value;
      handler(winningNumbers, Number(bonusNumber));
    });
  }
}
const PRIZE_MONEY = Object.freeze({
  0: 0,
  5: 5e3,
  4: 5e4,
  3: 15e5,
  2: 3e7,
  1: 2e9
});
const AMOUNT_PRICE = 1e3;
class LottoGame {
  #winningNumbers;
  #bonusNumber;
  constructor(winningNumbers, bonusNumber) {
    this.#winningNumbers = winningNumbers;
    this.#bonusNumber = bonusNumber;
  }
  getStatistics(lottoList) {
    const grade = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0 };
    lottoList.getLottoList().forEach((lotto) => {
      const gradeNum = this.#match(lotto);
      grade[gradeNum]++;
    });
    return grade;
  }
  getMatchCount(lotto) {
    let matchingCount = 0;
    let hasBonus = false;
    lotto.getNumbers().forEach((number) => {
      if (this.#winningNumbers.includes(number)) {
        matchingCount++;
      }
    });
    if (lotto.getNumbers().includes(this.#bonusNumber)) hasBonus = true;
    return {
      matchingCount,
      hasBonus
    };
  }
  #match(lotto) {
    const { matchingCount, hasBonus } = this.getMatchCount(lotto);
    if (matchingCount === 6) return 1;
    if (matchingCount === 5 && hasBonus) return 2;
    if (matchingCount === 5) return 3;
    if (matchingCount === 4) return 4;
    if (matchingCount === 3) return 5;
    return 0;
  }
  getBonusNumber() {
    return this.#bonusNumber;
  }
  getWinningNumbers() {
    return [...this.#winningNumbers];
  }
}
class Rate {
  #statistics;
  #price;
  constructor(statistics, price) {
    this.#statistics = statistics;
    this.#price = price;
  }
  #getTotal() {
    return Object.entries(this.#statistics).reduce((acc, [grade, count]) => {
      acc += PRIZE_MONEY[grade] * count;
      return acc;
    }, 0);
  }
  getRate() {
    const total = this.#getTotal();
    const rate = total / this.#price * 100;
    return Math.round(rate * 10) / 10;
  }
}
class StatisticsResultView {
  render({ statistics, rate }) {
    const modal = document.querySelector("#modal");
    const html = `
      <div class="ui-modal">
        <div class="modal-container">
          <button class="modal-button" id="modal-close-button">close</button>
          <div class="modal-content">
            <section id="lotto-game-result">
              <div class="ui-content-box">
                <div class="ui-title shape-main align-center">
                  <h1 class="title">🏆 당첨 통계 🏆</h1>
                </div>

                <!-- 당첨 통계 -->
                <div class="ui-table" id="result-staticstic">
                  <table>
                    <summary>당첨 통계</summary>
                    <thead>
                      <tr>
                        <th scope="col" class="align-center">일치 갯수</th>
                        <th scope="col" class="align-center">당첨금</th>
                        <th scope="col" class="align-center">당첨 갯수</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="align-center">3개</td>
                        <td class="align-center">5,000</td>
                        <td class="align-center">${statistics[5]}개</td>
                      </tr>
                      <tr>
                        <td class="align-center">4개</td>
                        <td class="align-center">50,000</td>
                        <td class="align-center">${statistics[4]}개</td>
                      </tr>
                      <tr>
                        <td class="align-center">5개</td>
                        <td class="align-center">1,500,000</td>
                        <td class="align-center">${statistics[3]}개</td>
                      </tr>
                      <tr>
                        <td class="align-center">5개+보너스볼</td>
                        <td class="align-center">30000,000</td>
                        <td class="align-center">${statistics[2]}개</td>
                      </tr>
                      <tr>
                        <td class="align-center">6개</td>
                        <td class="align-center">2,000,000,000</td>
                        <td class="align-center">${statistics[1]}개</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 수익률 -->
                <p class="ui-info shape-data align-center" id="rate-text">
                  당신의 총 수익률은 ${rate}%입니다.
                </p>

                <div class="ui-button-box">
                  <button class="ui-button variant-primary is-block" id="restart-button">
                    다시 시작하기
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;
    modal.innerHTML = html;
  }
  bindEvent(handler) {
    const restartButton = document.querySelector("#restart-button");
    restartButton.addEventListener("click", () => {
      handler();
    });
    const modalCloseButton = document.querySelector("#modal-close-button");
    modalCloseButton.addEventListener("click", () => {
      handler();
    });
  }
  renderReset() {
    const lottoResultBox = document.querySelector("#lotto-result-box");
    lottoResultBox.innerHTML = "";
    const uiModal = document.querySelector("#modal");
    uiModal.innerHTML = "";
    const priceInput = document.querySelector("#price input");
    priceInput.value = "";
  }
}
class StatisticsResultController {
  constructor() {
    this.view = new StatisticsResultView();
    this.model = {};
  }
  run(winningNumbers, bonusNumber, lottoList) {
    const lottoGame = new LottoGame(winningNumbers, bonusNumber);
    this.model.lottoGame = lottoGame;
    const statistics = lottoGame.getStatistics(lottoList);
    const rate = new Rate(
      statistics,
      lottoList.getLottoList().length * AMOUNT_PRICE
    );
    this.model.rate = rate;
    this.view.render({
      statistics,
      rate: rate.getRate(),
      lottoList
    });
    this.view.bindEvent(() => {
      this.#inputIsReady();
    });
  }
  #inputIsReady() {
    this.view.renderReset();
  }
}
class LottoResultController {
  view;
  model;
  constructor() {
    this.view = new LottoResultView();
    this.model = {};
  }
  run(amount) {
    const lottoList = new LottoList(amount);
    this.model.lottoList = lottoList;
    this.view.render({ amount, lottoList });
    this.view.bindEvent((winningNumbers, bonusNumber) => {
      this.#inputLottoNumbers(winningNumbers, bonusNumber);
    });
  }
  #inputLottoNumbers(winningNumbers, bonusNumber) {
    const statisticsResultController = new StatisticsResultController();
    statisticsResultController.run(
      winningNumbers,
      bonusNumber,
      this.model.lottoList
    );
  }
}
class AppController {
  view;
  constructor() {
    this.view = new AppView();
  }
  run() {
    this.view.render({});
    this.view.bindEvent((price) => {
      this.#inputPrice(price);
    });
  }
  #inputPrice(price) {
    const amount = price / AMOUNT_PRICE;
    const lottoResultController = new LottoResultController();
    lottoResultController.run(amount);
  }
}
class App {
  constructor() {
  }
  async run() {
    const appController = new AppController();
    appController.run();
  }
}
const app = new App();
app.run();
