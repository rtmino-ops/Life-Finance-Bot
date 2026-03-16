const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) tg.expand();

const incomeCategories = [
  { value: "salary", label: "Зарплата" },
  { value: "parttime", label: "Подработка" },
  { value: "gift", label: "Подарки" },
  { value: "investment", label: "Инвестиции" },
  { value: "other_income", label: "Прочее" }
];

const expenseCategories = [
  { value: "food", label: "Еда" },
  { value: "transport", label: "Транспорт" },
  { value: "housing", label: "Жилье" },
  { value: "fun", label: "Развлечения" },
  { value: "health", label: "Здоровье" },
  { value: "shopping", label: "Покупки" },
  { value: "sport", label: "Спорт" },
  { value: "other_expense", label: "Прочее" }
];

const state = {
  telegramId: null,
  username: "Пользователь",
  income: 0,
  expense: 0,
  balance: 0,
  calories: 0,
  sportCount: 0,
  operations: [],
  food: [],
  sport: [],
  financeFilter: "all",
  periodFilter: "today",
  customDateFrom: null,
  customDateTo: null
};

let expenseChart = null;

const userInfoEl = document.getElementById("userInfo");
const balanceValueEl = document.getElementById("balanceValue");
const incomeValueEl = document.getElementById("incomeValue");
const expenseValueEl = document.getElementById("expenseValue");
const caloriesValueEl = document.getElementById("caloriesValue");
const sportCountValueEl = document.getElementById("sportCountValue");

const periodIncomeValueEl = document.getElementById("periodIncomeValue");
const periodExpenseValueEl = document.getElementById("periodExpenseValue");
const periodBalanceValueEl = document.getElementById("periodBalanceValue");
const categoryStatsEl = document.getElementById("categoryStats");

const operationsListEl = document.getElementById("operationsList");
const foodListEl = document.getElementById("foodList");
const sportListEl = document.getElementById("sportList");

const financeModal = document.getElementById("financeModal");
const foodModal = document.getElementById("foodModal");
const sportModal = document.getElementById("sportModal");

const financeModalTitle = document.getElementById("financeModalTitle");
const financeTypeInput = document.getElementById("financeType");
const financeAmountInput = document.getElementById("financeAmount");
const financeCategoryInput = document.getElementById("financeCategory");
const financeCommentInput = document.getElementById("financeComment");

const foodTypeInput = document.getElementById("foodType");
const foodNameInput = document.getElementById("foodName");
const foodCaloriesInput = document.getElementById("foodCalories");

const sportTypeInput = document.getElementById("sportType");
const sportValueInput = document.getElementById("sportValue");

const openIncomeBtn = document.getElementById("openIncomeBtn");
const openExpenseBtn = document.getElementById("openExpenseBtn");
const financeIncomeBtn = document.getElementById("financeIncomeBtn");
const financeExpenseBtn = document.getElementById("financeExpenseBtn");

const openFoodBtn = document.getElementById("openFoodBtn");
const foodAddBtn = document.getElementById("foodAddBtn");

const openSportBtn = document.getElementById("openSportBtn");
const sportAddBtn = document.getElementById("sportAddBtn");

const saveFinanceBtn = document.getElementById("saveFinanceBtn");
const saveFoodBtn = document.getElementById("saveFoodBtn");
const saveSportBtn = document.getElementById("saveSportBtn");

const customPeriodBoxEl = document.getElementById("customPeriodBox");
const dateFromEl = document.getElementById("dateFrom");
const dateToEl = document.getElementById("dateTo");
const applyCustomPeriodBtn = document.getElementById("applyCustomPeriodBtn");

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function initTelegramUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    state.telegramId = user.id;
    state.username = user.first_name || "Пользователь";
    userInfoEl.textContent = `Telegram ID: ${state.telegramId} | ${state.username}`;
  } else {
    state.telegramId = 999999;
    state.username = "Test User";
    userInfoEl.textContent = `Тестовый режим | Telegram ID: ${state.telegramId}`;
  }
}

function fillFinanceCategories(type) {
  const list = type === "income" ? incomeCategories : expenseCategories;

  financeCategoryInput.innerHTML = list
    .map(item => `<option value="${item.value}">${item.label}</option>`)
    .join("");
}

async function ensureProfile() {
  if (!supabaseClient || !state.telegramId) return;

  const { data } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", state.telegramId)
    .maybeSingle();

  if (!data) {
    await supabaseClient.from("profiles").insert({
      id: state.telegramId,
      username: state.username
    });
  }
}

async function loadFinance() {
  if (!supabaseClient || !state.telegramId) return;

  const { data, error } = await supabaseClient
    .from("finance_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  state.operations = data || [];

  state.income = state.operations
    .filter(item => item.record_type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  state.expense = state.operations
    .filter(item => item.record_type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

async function loadFood() {
  if (!supabaseClient || !state.telegramId) return;

  const { data, error } = await supabaseClient
    .from("food_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  state.food = data || [];
  state.calories = state.food.reduce((sum, item) => sum + Number(item.calories || 0), 0);
}

async function loadSport() {
  if (!supabaseClient || !state.telegramId) return;

  const { data, error } = await supabaseClient
    .from("sport_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  state.sport = data || [];
  state.sportCount = state.sport.length;
}

function renderSummary() {
  state.balance = state.income - state.expense;

  balanceValueEl.textContent = state.balance;
  incomeValueEl.textContent = state.income;
  expenseValueEl.textContent = state.expense;
  caloriesValueEl.textContent = state.calories;
  sportCountValueEl.textContent = state.sportCount;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("ru-RU");
}

function isInSelectedPeriod(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  if (state.periodFilter === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (state.periodFilter === "7") {
    const from = new Date();
    from.setDate(now.getDate() - 7);
    return date >= from;
  }

  if (state.periodFilter === "30") {
    const from = new Date();
    from.setDate(now.getDate() - 30);
    return date >= from;
  }

  if (state.periodFilter === "custom") {
    if (!state.customDateFrom || !state.customDateTo) return true;

    const from = new Date(state.customDateFrom + "T00:00:00");
    const to = new Date(state.customDateTo + "T23:59:59");

    return date >= from && date <= to;
  }

  return true;
}

function getFilteredOperations() {
  let operations = [...state.operations];

  if (state.financeFilter !== "all") {
    operations = operations.filter(item => item.record_type === state.financeFilter);
  }

  operations = operations.filter(item => isInSelectedPeriod(item.created_at));

  return operations;
}

function renderOperations() {
  const operations = getFilteredOperations();

  if (!operations.length) {
    operationsListEl.textContent = "Пока нет операций за выбранный период";
    return;
  }

  operationsListEl.innerHTML = operations
    .map(item => `
      <div class="operation-item">
        <div class="operation-top">
          <div>
            <div class="operation-type ${item.record_type}">
              ${item.record_type === "income" ? "Доход" : "Расход"} — ${item.amount}
            </div>
            <div class="operation-date">${formatDate(item.created_at)}</div>
          </div>
          <button class="delete-btn" data-id="${item.id}" data-kind="finance">Удалить</button>
        </div>
        <div class="operation-meta">
          ${item.category}${item.comment ? " | " + item.comment : ""}
        </div>
      </div>
    `)
    .join("");

  document.querySelectorAll('[data-kind="finance"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteFinanceRecord(id);
    });
  });
}

function renderFood() {
  if (!state.food.length) {
    foodListEl.textContent = "Пока нет записей";
    return;
  }

  foodListEl.innerHTML = state.food
    .map(item => `
      <div class="operation-item">
        <div class="operation-top">
          <div>
            <div class="operation-type">${item.meal_type} — ${item.title}</div>
            <div class="operation-date">${formatDate(item.created_at)}</div>
          </div>
        </div>
        <div class="operation-meta">${item.calories} ккал</div>
      </div>
    `)
    .join("");
}

function renderSport() {
  if (!state.sport.length) {
    sportListEl.textContent = "Пока нет записей";
    return;
  }

  sportListEl.innerHTML = state.sport
    .map(item => `
      <div class="operation-item">
        <div class="operation-top">
          <div>
            <div class="operation-type">${item.activity_type}</div>
            <div class="operation-date">${formatDate(item.created_at)}</div>
          </div>
        </div>
        <div class="operation-meta">${item.activity_value}</div>
      </div>
    `)
    .join("");
}

function renderPeriodAnalytics() {
  const operations = state.operations.filter(item => isInSelectedPeriod(item.created_at));

  const periodIncome = operations
    .filter(item => item.record_type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const periodExpense = operations
    .filter(item => item.record_type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const periodBalance = periodIncome - periodExpense;

  periodIncomeValueEl.textContent = periodIncome;
  periodExpenseValueEl.textContent = periodExpense;
  periodBalanceValueEl.textContent = periodBalance;
}

function renderCategoryStats() {
  const expenseOperations = state.operations.filter(
    item => item.record_type === "expense" && isInSelectedPeriod(item.created_at)
  );

  if (!expenseOperations.length) {
    categoryStatsEl.textContent = "Нет расходов за выбранный период";
    renderExpenseChart({});
    return;
  }

  const grouped = {};

  expenseOperations.forEach(item => {
    grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount);
  });

  const maxValue = Math.max(...Object.values(grouped));

  categoryStatsEl.innerHTML = Object.entries(grouped)
    .map(([category, amount]) => {
      const width = (amount / maxValue) * 100;
      return `
        <div class="category-row">
          <div class="category-label">
            <span>${category}</span>
            <strong>${amount}</strong>
          </div>
          <div class="category-bar">
            <div class="category-bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  renderExpenseChart(grouped);
}

function renderExpenseChart(grouped) {
  const ctx = document.getElementById("expenseChart");

  if (!ctx) return;

  if (expenseChart) {
    expenseChart.destroy();
  }

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  if (!labels.length) {
    expenseChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Нет данных"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#e5e7eb"]
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
    return;
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#2563eb",
            "#16a34a",
            "#dc2626",
            "#ea580c",
            "#7c3aed",
            "#0891b2",
            "#db2777",
            "#65a30d"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderAll() {
  renderSummary();
  renderOperations();
  renderFood();
  renderSport();
  renderPeriodAnalytics();
  renderCategoryStats();
}

function openFinanceModal(type) {
  financeTypeInput.value = type;
  financeModalTitle.textContent = type === "income" ? "Добавить доход" : "Добавить расход";
  financeAmountInput.value = "";
  financeCommentInput.value = "";

  fillFinanceCategories(type);
  openModal(financeModal);
}

function fillFinanceCategories(type) {
  const list = type === "income" ? incomeCategories : expenseCategories;

  financeCategoryInput.innerHTML = list
    .map(item => `<option value="${item.value}">${item.label}</option>`)
    .join("");
}

async function saveFinance() {
  const type = financeTypeInput.value;
  const amount = Number(financeAmountInput.value);
  const category = financeCategoryInput.value;
  const comment = financeCommentInput.value.trim();

  if (!amount || amount <= 0) {
    alert("Введите сумму");
    return;
  }

  const { error } = await supabaseClient.from("finance_records").insert({
    telegram_id: state.telegramId,
    record_type: type,
    amount,
    category,
    comment
  });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения");
    return;
  }

  closeModal(financeModal);
  await loadFinance();
  renderAll();
}

async function deleteFinanceRecord(id) {
  const { error } = await supabaseClient
    .from("finance_records")
    .delete()
    .eq("id", id)
    .eq("telegram_id", state.telegramId);

  if (error) {
    console.error(error);
    alert("Ошибка удаления");
    return;
  }

  await loadFinance();
  renderAll();
}

async function saveFood() {
  const meal_type = foodTypeInput.value;
  const title = foodNameInput.value.trim();
  const calories = Number(foodCaloriesInput.value || 0);

  if (!title) {
    alert("Введите блюдо");
    return;
  }

  const { error } = await supabaseClient.from("food_records").insert({
    telegram_id: state.telegramId,
    meal_type,
    title,
    calories
  });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения");
    return;
  }

  foodNameInput.value = "";
  foodCaloriesInput.value = "";
  closeModal(foodModal);
  await loadFood();
  renderAll();
}

async function saveSport() {
  const activity_type = sportTypeInput.value.trim();
  const activity_value = sportValueInput.value.trim();

  if (!activity_type || !activity_value) {
    alert("Заполни тип и значение");
    return;
  }

  const { error } = await supabaseClient.from("sport_records").insert({
    telegram_id: state.telegramId,
    activity_type,
    activity_value
  });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения");
    return;
  }

  sportTypeInput.value = "";
  sportValueInput.value = "";
  closeModal(sportModal);
  await loadSport();
  renderAll();
}

async function initApp() {
  initTelegramUser();
  await ensureProfile();
  await loadFinance();
  await loadFood();
  await loadSport();
  renderAll();
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const modalId = btn.dataset.close;
    closeModal(document.getElementById(modalId));
  });
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(item => item.classList.remove("active"));
    btn.classList.add("active");
    state.financeFilter = btn.dataset.filter;
    renderOperations();
  });
});

document.querySelectorAll(".period-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn").forEach(item => item.classList.remove("active"));
    btn.classList.add("active");

    state.periodFilter = btn.dataset.period;

    if (state.periodFilter === "custom") {
      customPeriodBoxEl.classList.remove("hidden");
    } else {
      customPeriodBoxEl.classList.add("hidden");
      renderAll();
    }
  });
});

applyCustomPeriodBtn.addEventListener("click", () => {
  state.customDateFrom = dateFromEl.value;
  state.customDateTo = dateToEl.value;
  renderAll();
});

openIncomeBtn.addEventListener("click", () => openFinanceModal("income"));
openExpenseBtn.addEventListener("click", () => openFinanceModal("expense"));
financeIncomeBtn.addEventListener("click", () => openFinanceModal("income"));
financeExpenseBtn.addEventListener("click", () => openFinanceModal("expense"));

openFoodBtn.addEventListener("click", () => openModal(foodModal));
foodAddBtn.addEventListener("click", () => openModal(foodModal));

openSportBtn.addEventListener("click", () => openModal(sportModal));
sportAddBtn.addEventListener("click", () => openModal(sportModal));

saveFinanceBtn.addEventListener("click", saveFinance);
saveFoodBtn.addEventListener("click", saveFood);
saveSportBtn.addEventListener("click", saveSport);

initApp();