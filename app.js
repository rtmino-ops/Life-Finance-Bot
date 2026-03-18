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

const categoryMap = {};
[...incomeCategories, ...expenseCategories].forEach(item => {
  categoryMap[item.value] = item.label;
});

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
  recurring: [],
  goals: [],
  planner: [],
  financeFilter: "all",
  periodFilter: "today",
  customDateFrom: null,
  customDateTo: null,
  searchQuery: "",
  categoryFilter: "all",
  monthlyBudget: 0,
  categoryBudgets: []
};

const userInfoEl = document.getElementById("userInfo");
const balanceValueEl = document.getElementById("balanceValue");
const incomeValueEl = document.getElementById("incomeValue");
const expenseValueEl = document.getElementById("expenseValue");
const caloriesValueEl = document.getElementById("caloriesValue");
const sportCountValueEl = document.getElementById("sportCountValue");
const remindersListEl = document.getElementById("remindersList");

const periodIncomeValueEl = document.getElementById("periodIncomeValue");
const periodExpenseValueEl = document.getElementById("periodExpenseValue");
const periodBalanceValueEl = document.getElementById("periodBalanceValue");

const summaryVisualChartEl = document.getElementById("summaryVisualChart");
const incomeCategoryChartEl = document.getElementById("incomeCategoryChart");
const expenseCategoryChartEl = document.getElementById("expenseCategoryChart");

const monthlyBudgetInputEl = document.getElementById("monthlyBudgetInput");
const saveMonthlyBudgetBtn = document.getElementById("saveMonthlyBudgetBtn");
const monthlyBudgetValueEl = document.getElementById("monthlyBudgetValue");
const monthlySpentValueEl = document.getElementById("monthlySpentValue");
const monthlyLeftValueEl = document.getElementById("monthlyLeftValue");
const monthlyBudgetBarEl = document.getElementById("monthlyBudgetBar");
const budgetWarningEl = document.getElementById("budgetWarning");

const categoryBudgetCategoryEl = document.getElementById("categoryBudgetCategory");
const categoryBudgetAmountEl = document.getElementById("categoryBudgetAmount");
const saveCategoryBudgetBtn = document.getElementById("saveCategoryBudgetBtn");
const categoryBudgetListEl = document.getElementById("categoryBudgetList");

const openRecurringBtn = document.getElementById("openRecurringBtn");
const recurringListEl = document.getElementById("recurringList");

const openGoalBtn = document.getElementById("openGoalBtn");
const goalsListEl = document.getElementById("goalsList");

const openPlannerBtn = document.getElementById("openPlannerBtn");
const plannerListEl = document.getElementById("plannerList");

const openFinanceFiltersBtn = document.getElementById("openFinanceFiltersBtn");
const openBudgetBtn = document.getElementById("openBudgetBtn");
const openCategoryBudgetBtn = document.getElementById("openCategoryBudgetBtn");
const openFinanceHistoryBtn = document.getElementById("openFinanceHistoryBtn");

const financeFiltersModal = document.getElementById("financeFiltersModal");
const budgetModal = document.getElementById("budgetModal");
const categoryBudgetModal = document.getElementById("categoryBudgetModal");
const financeHistoryModal = document.getElementById("financeHistoryModal");

const recurringModal = document.getElementById("recurringModal");
const recurringTitleEl = document.getElementById("recurringTitle");
const recurringAmountEl = document.getElementById("recurringAmount");
const recurringCategoryEl = document.getElementById("recurringCategory");
const recurringDayEl = document.getElementById("recurringDay");
const recurringCommentEl = document.getElementById("recurringComment");
const saveRecurringBtn = document.getElementById("saveRecurringBtn");

const goalModal = document.getElementById("goalModal");
const goalTitleEl = document.getElementById("goalTitle");
const goalTargetAmountEl = document.getElementById("goalTargetAmount");
const saveGoalBtn = document.getElementById("saveGoalBtn");

const plannerModal = document.getElementById("plannerModal");
const plannerTitleEl = document.getElementById("plannerTitle");
const plannerPeriodEl = document.getElementById("plannerPeriod");
const plannerDateEl = document.getElementById("plannerDate");
const savePlannerBtn = document.getElementById("savePlannerBtn");

const operationsListEl = document.getElementById("operationsList");
const foodListEl = document.getElementById("foodList");
const sportListEl = document.getElementById("sportList");

const financeModal = document.getElementById("financeModal");
const foodModal = document.getElementById("foodModal");
const sportModal = document.getElementById("sportModal");

const financeModalTitle = document.getElementById("financeModalTitle");
const financeTypeInput = document.getElementById("financeType");
const editingFinanceIdInput = document.getElementById("editingFinanceId");
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
const openIncomeBtn2 = document.getElementById("openIncomeBtn2");
const openExpenseBtn2 = document.getElementById("openExpenseBtn2");

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

const searchInputEl = document.getElementById("searchInput");
const categoryFilterEl = document.getElementById("categoryFilter");

function openModal(modal) {
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (modal) modal.classList.add("hidden");
}

function initTelegramUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    state.telegramId = user.id;
    state.username = user.first_name || "Пользователь";
    if (userInfoEl) userInfoEl.textContent = `Telegram ID: ${state.telegramId} | ${state.username}`;
  } else {
    state.telegramId = 999999;
    state.username = "Test User";
    if (userInfoEl) userInfoEl.textContent = `Тестовый режим | Telegram ID: ${state.telegramId}`;
  }
}

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fillFinanceCategories(type, selectedValue = null) {
  if (!financeCategoryInput) return;
  const list = type === "income" ? incomeCategories : expenseCategories;
  financeCategoryInput.innerHTML = list.map(item => `
    <option value="${item.value}" ${selectedValue === item.value ? "selected" : ""}>
      ${item.label}
    </option>
  `).join("");
}

function fillCategoryFilter() {
  if (!categoryFilterEl) return;
  categoryFilterEl.innerHTML =
    `<option value="all">Все категории</option>` +
    [...incomeCategories, ...expenseCategories]
      .map(item => `<option value="${item.value}">${item.label}</option>`)
      .join("");
}

function fillCategoryBudgetSelect() {
  if (!categoryBudgetCategoryEl) return;
  categoryBudgetCategoryEl.innerHTML = expenseCategories
    .map(item => `<option value="${item.value}">${item.label}</option>`)
    .join("");
}

function fillRecurringCategorySelect() {
  if (!recurringCategoryEl) return;
  recurringCategoryEl.innerHTML = expenseCategories
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
  const { data, error } = await supabaseClient
    .from("finance_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.operations = data || [];
  state.income = state.operations.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  state.expense = state.operations.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
}

async function loadFood() {
  const { data, error } = await supabaseClient
    .from("food_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.food = data || [];
  state.calories = state.food.reduce((s, i) => s + Number(i.calories || 0), 0);
}

async function loadSport() {
  const { data, error } = await supabaseClient
    .from("sport_records")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.sport = data || [];
  state.sportCount = state.sport.length;
}

async function loadBudgets() {
  const monthKey = getMonthKey();

  const { data: budgetData, error: budgetError } = await supabaseClient
    .from("budgets")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .eq("month_key", monthKey)
    .maybeSingle();

  if (budgetError) throw budgetError;

  state.monthlyBudget = budgetData ? Number(budgetData.total_budget) : 0;

  const { data: categoryData, error: categoryError } = await supabaseClient
    .from("category_budgets")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .eq("month_key", monthKey);

  if (categoryError) throw categoryError;

  state.categoryBudgets = categoryData || [];
}

async function loadRecurring() {
  const { data, error } = await supabaseClient
    .from("recurring_payments")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .eq("is_active", true)
    .order("day_of_month", { ascending: true });

  if (error) throw error;

  state.recurring = data || [];
}

async function loadGoals() {
  const { data, error } = await supabaseClient
    .from("saving_goals")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.goals = data || [];
}

async function loadPlanner() {
  const { data, error } = await supabaseClient
    .from("planner_tasks")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  state.planner = data || [];
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("ru-RU");
}

function isInSelectedPeriod(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  if (state.periodFilter === "today") return date.toDateString() === now.toDateString();
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

  if (state.categoryFilter !== "all") {
    operations = operations.filter(item => item.category === state.categoryFilter);
  }

  if (state.searchQuery.trim()) {
    const query = state.searchQuery.trim().toLowerCase();

    operations = operations.filter(item => {
      const comment = (item.comment || "").toLowerCase();
      const categoryLabel = (categoryMap[item.category] || item.category || "").toLowerCase();
      const typeLabel = item.record_type === "income" ? "доход" : "расход";
      return comment.includes(query) || categoryLabel.includes(query) || typeLabel.includes(query);
    });
  }

  return operations;
}

function getPeriodOperations() {
  return state.operations.filter(item => isInSelectedPeriod(item.created_at));
}

function getGroupedByCategory(recordType) {
  const grouped = {};
  getPeriodOperations()
    .filter(item => item.record_type === recordType)
    .forEach(item => {
      grouped[item.category] = (grouped[item.category] || 0) + Number(item.amount);
    });
  return grouped;
}

function renderSummary() {
  state.balance = state.income - state.expense;
  if (balanceValueEl) balanceValueEl.textContent = state.balance;
  if (incomeValueEl) incomeValueEl.textContent = state.income;
  if (expenseValueEl) expenseValueEl.textContent = state.expense;
  if (caloriesValueEl) caloriesValueEl.textContent = state.calories;
  if (sportCountValueEl) sportCountValueEl.textContent = state.sportCount;
}

function renderOperations() {
  if (!operationsListEl) return;

  const operations = getFilteredOperations();

  if (!operations.length) {
    operationsListEl.textContent = "Пока нет операций по выбранным фильтрам";
    return;
  }

  operationsListEl.innerHTML = operations.map(item => `
    <div class="operation-item">
      <div class="operation-top">
        <div>
          <div class="operation-type ${item.record_type}">
            ${item.record_type === "income" ? "Доход" : "Расход"} — ${item.amount}
          </div>
          <div class="operation-date">${formatDate(item.created_at)}</div>
        </div>
        <div class="operation-actions">
          <button class="edit-btn" data-edit-id="${item.id}">Редактировать</button>
          <button class="delete-btn" data-id="${item.id}" data-kind="finance">Удалить</button>
        </div>
      </div>
      <div class="operation-meta">
        ${categoryMap[item.category] || item.category}${item.comment ? " | " + item.comment : ""}
      </div>
    </div>
  `).join("");

  document.querySelectorAll('[data-kind="finance"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      await deleteFinanceRecord(btn.dataset.id);
    });
  });

  document.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = state.operations.find(op => op.id === Number(btn.dataset.editId));
      if (item) openEditFinanceModal(item);
    });
  });
}

function renderFood() {
  if (!foodListEl) return;
  if (!state.food.length) {
    foodListEl.textContent = "Пока нет записей";
    return;
  }

  foodListEl.innerHTML = state.food.map(item => `
    <div class="operation-item">
      <div class="operation-top">
        <div>
          <div class="operation-type">${item.meal_type} — ${item.title}</div>
          <div class="operation-date">${formatDate(item.created_at)}</div>
        </div>
      </div>
      <div class="operation-meta">${item.calories} ккал</div>
    </div>
  `).join("");
}

function renderSport() {
  if (!sportListEl) return;
  if (!state.sport.length) {
    sportListEl.textContent = "Пока нет записей";
    return;
  }

  sportListEl.innerHTML = state.sport.map(item => `
    <div class="operation-item">
      <div class="operation-top">
        <div>
          <div class="operation-type">${item.activity_type}</div>
          <div class="operation-date">${formatDate(item.created_at)}</div>
        </div>
      </div>
      <div class="operation-meta">${item.activity_value}</div>
    </div>
  `).join("");
}

function renderPeriodAnalytics() {
  if (!periodIncomeValueEl || !periodExpenseValueEl || !periodBalanceValueEl) return;

  const operations = getPeriodOperations();
  const periodIncome = operations.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const periodExpense = operations.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
  const periodBalance = periodIncome - periodExpense;

  periodIncomeValueEl.textContent = periodIncome;
  periodExpenseValueEl.textContent = periodExpense;
  periodBalanceValueEl.textContent = periodBalance;
}

function renderVisualSummaryChart() {
  if (!summaryVisualChartEl) return;

  const operations = getPeriodOperations();
  const income = operations.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const expense = operations.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
  const total = income + expense;

  const incomePercent = total > 0 ? (income / total) * 100 : 0;
  const expensePercent = total > 0 ? (expense / total) * 100 : 0;

  summaryVisualChartEl.innerHTML = `
    <div class="chart-row">
      <div class="chart-row-label">
        <span>Доходы</span>
        <strong>${income}</strong>
      </div>
      <div class="chart-bar-bg">
        <div class="chart-bar-fill income" style="width:${incomePercent}%"></div>
      </div>
    </div>
    <div class="chart-row">
      <div class="chart-row-label">
        <span>Расходы</span>
        <strong>${expense}</strong>
      </div>
      <div class="chart-bar-bg">
        <div class="chart-bar-fill expense" style="width:${expensePercent}%"></div>
      </div>
    </div>
  `;
}

function renderVisualCategoryChart(targetEl, grouped, type) {
  if (!targetEl) return;

  const entries = Object.entries(grouped);

  if (!entries.length) {
    targetEl.textContent = "Нет данных за выбранный период";
    return;
  }

  const maxValue = Math.max(...entries.map(([, amount]) => amount));
  const fillClass = type === "income" ? "income" : "expense";

  targetEl.innerHTML = entries.map(([category, amount]) => {
    const percent = maxValue > 0 ? (amount / maxValue) * 100 : 0;

    return `
      <div class="chart-row">
        <div class="chart-row-label">
          <span>${categoryMap[category] || category}</span>
          <strong>${amount}</strong>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill ${fillClass}" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderFinanceCharts() {
  renderVisualSummaryChart();
  renderVisualCategoryChart(incomeCategoryChartEl, getGroupedByCategory("income"), "income");
  renderVisualCategoryChart(expenseCategoryChartEl, getGroupedByCategory("expense"), "expense");
}

function renderBudgetBlock() {
  if (!monthlyBudgetValueEl) return;

  const monthKey = getMonthKey();

  const monthExpenses = state.operations.filter(item => {
    const date = new Date(item.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return item.record_type === "expense" && key === monthKey;
  });

  const spent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const budget = Number(state.monthlyBudget || 0);
  const left = budget - spent;

  monthlyBudgetValueEl.textContent = budget;
  monthlySpentValueEl.textContent = spent;
  monthlyLeftValueEl.textContent = left;

  let percent = 0;
  if (budget > 0) percent = Math.min((spent / budget) * 100, 100);
  if (monthlyBudgetBarEl) monthlyBudgetBarEl.style.width = `${percent}%`;

  if (budgetWarningEl) {
    budgetWarningEl.classList.add("hidden");
    budgetWarningEl.textContent = "";

    if (budget > 0 && spent >= budget) {
      budgetWarningEl.textContent = "Бюджет месяца превышен";
      budgetWarningEl.classList.remove("hidden");
    } else if (budget > 0 && spent >= budget * 0.8) {
      budgetWarningEl.textContent = "Внимание: использовано более 80% бюджета";
      budgetWarningEl.classList.remove("hidden");
    }
  }
}

function renderCategoryBudgets() {
  if (!categoryBudgetListEl) return;

  const monthKey = getMonthKey();

  const monthExpenses = state.operations.filter(item => {
    const date = new Date(item.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return item.record_type === "expense" && key === monthKey;
  });

  if (!state.categoryBudgets.length) {
    categoryBudgetListEl.textContent = "Лимиты пока не заданы";
    return;
  }

  categoryBudgetListEl.innerHTML = state.categoryBudgets.map(item => {
    const spent = monthExpenses.filter(exp => exp.category === item.category).reduce((sum, exp) => sum + Number(exp.amount), 0);
    const limit = Number(item.limit_amount);
    const left = limit - spent;
    const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

    let colorClass = "green";
    if (spent >= limit) colorClass = "red";
    else if (spent >= limit * 0.8) colorClass = "yellow";

    return `
      <div class="budget-row">
        <div class="category-label">
          <span>${categoryMap[item.category] || item.category}</span>
          <strong class="${colorClass}">${spent} / ${limit}</strong>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${percent}%"></div>
        </div>
        <small>Осталось: ${left}</small>
      </div>
    `;
  }).join("");
}

function renderRecurring() {
  if (!recurringListEl) return;

  if (!state.recurring.length) {
    recurringListEl.textContent = "Пока нет регулярных платежей";
    return;
  }

  recurringListEl.innerHTML = state.recurring.map(item => `
    <div class="recurring-item">
      <strong>${item.title}</strong> — ${item.amount}
      <br />
      <small>${categoryMap[item.category] || item.category} | ${item.day_of_month} числа</small>
      ${item.comment ? `<br /><small>${item.comment}</small>` : ""}
      <div class="recurring-actions">
        <button class="recurring-pay-btn" data-pay-id="${item.id}">Учесть платеж</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-pay-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const item = state.recurring.find(x => x.id === Number(btn.dataset.payId));
      if (item) await applyRecurringPayment(item);
    });
  });
}

function renderGoals() {
  if (!goalsListEl) return;

  if (!state.goals.length) {
    goalsListEl.textContent = "Пока нет целей";
    return;
  }

  goalsListEl.innerHTML = state.goals.map(item => {
    const percent = item.target_amount > 0
      ? Math.min((Number(item.current_amount) / Number(item.target_amount)) * 100, 100)
      : 0;

    return `
      <div class="goal-row">
        <div class="category-label">
          <span>${item.title}</span>
          <strong>${item.current_amount} / ${item.target_amount}</strong>
        </div>
        <div class="category-bar">
          <div class="category-bar-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderPlanner() {
  if (!plannerListEl) return;

  if (!state.planner.length) {
    plannerListEl.textContent = "Пока нет задач";
    return;
  }

  plannerListEl.innerHTML = state.planner.map(item => `
    <div class="task-row">
      <div class="task-top">
        <div>
          <div class="operation-type">${item.title}</div>
          <div class="operation-date">${item.period_type} | ${item.due_date || "без даты"}</div>
        </div>
        <button class="${item.is_done ? "edit-btn" : "done-btn"}" data-task-id="${item.id}">
          ${item.is_done ? "Сделано" : "Выполнить"}
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-task-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await togglePlannerTask(btn.dataset.taskId);
    });
  });
}

function getReminders() {
  const reminders = [];
  const today = new Date().getDate();
  const monthKey = getMonthKey();

  const monthExpenses = state.operations.filter(item => {
    const date = new Date(item.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return item.record_type === "expense" && key === monthKey;
  });

  state.recurring.forEach(item => {
    if (item.day_of_month === today) {
      reminders.push(`Сегодня регулярный платеж: ${item.title} — ${item.amount}`);
    } else if (item.day_of_month > today && item.day_of_month - today <= 3) {
      reminders.push(`Скоро платеж: ${item.title} (${item.day_of_month} числа)`);
    }
  });

  if (state.monthlyBudget > 0) {
    const spent = monthExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    if (spent >= state.monthlyBudget) {
      reminders.push("Месячный бюджет превышен");
    } else if (spent >= state.monthlyBudget * 0.8) {
      reminders.push("Бюджет месяца почти исчерпан");
    }
  }

  state.planner.forEach(task => {
    if (!task.is_done) {
      reminders.push(`Задача: ${task.title}`);
    }
  });

  return reminders;
}

function renderReminders() {
  if (!remindersListEl) return;

  const reminders = getReminders();

  if (!reminders.length) {
    remindersListEl.textContent = "Пока нет напоминаний";
    return;
  }

  remindersListEl.innerHTML = reminders.map(item => `<div class="reminder-item">${item}</div>`).join("");
}

function renderAll() {
  renderSummary();
  renderOperations();
  renderFood();
  renderSport();
  renderPeriodAnalytics();
  renderFinanceCharts();
  renderBudgetBlock();
  renderCategoryBudgets();
  renderRecurring();
  renderGoals();
  renderPlanner();
  renderReminders();
}

function openFinanceModal(type) {
  financeTypeInput.value = type;
  editingFinanceIdInput.value = "";
  if (financeModalTitle) {
    financeModalTitle.textContent = type === "income" ? "Добавить доход" : "Добавить расход";
  }
  financeAmountInput.value = "";
  financeCommentInput.value = "";
  fillFinanceCategories(type);
  openModal(financeModal);
}

function openEditFinanceModal(item) {
  financeTypeInput.value = item.record_type;
  editingFinanceIdInput.value = item.id;
  if (financeModalTitle) {
    financeModalTitle.textContent = item.record_type === "income" ? "Редактировать доход" : "Редактировать расход";
  }
  financeAmountInput.value = item.amount;
  financeCommentInput.value = item.comment || "";
  fillFinanceCategories(item.record_type, item.category);
  openModal(financeModal);
}

async function saveFinance() {
  const id = editingFinanceIdInput.value;
  const type = financeTypeInput.value;
  const amount = Number(financeAmountInput.value);
  const category = financeCategoryInput.value;
  const comment = financeCommentInput.value.trim();

  if (!amount || amount <= 0) {
    alert("Введите сумму");
    return;
  }

  let error = null;

  if (id) {
    const result = await supabaseClient
      .from("finance_records")
      .update({ record_type: type, amount, category, comment })
      .eq("id", id)
      .eq("telegram_id", state.telegramId);

    error = result.error;
  } else {
    const result = await supabaseClient.from("finance_records").insert({
      telegram_id: state.telegramId,
      record_type: type,
      amount,
      category,
      comment
    });

    error = result.error;
  }

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

async function saveMonthlyBudget() {
  const total_budget = Number(monthlyBudgetInputEl.value);
  const month_key = getMonthKey();

  if (!total_budget || total_budget <= 0) {
    alert("Введите бюджет");
    return;
  }

  const { data } = await supabaseClient
    .from("budgets")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .eq("month_key", month_key)
    .maybeSingle();

  let error = null;

  if (data) {
    const result = await supabaseClient
      .from("budgets")
      .update({ total_budget })
      .eq("id", data.id);

    error = result.error;
  } else {
    const result = await supabaseClient
      .from("budgets")
      .insert({ telegram_id: state.telegramId, month_key, total_budget });

    error = result.error;
  }

  if (error) {
    console.error(error);
    alert("Ошибка сохранения бюджета");
    return;
  }

  monthlyBudgetInputEl.value = "";
  await loadBudgets();
  renderAll();
}

async function saveCategoryBudget() {
  const category = categoryBudgetCategoryEl.value;
  const limit_amount = Number(categoryBudgetAmountEl.value);
  const month_key = getMonthKey();

  if (!limit_amount || limit_amount <= 0) {
    alert("Введите лимит");
    return;
  }

  const { data } = await supabaseClient
    .from("category_budgets")
    .select("*")
    .eq("telegram_id", state.telegramId)
    .eq("month_key", month_key)
    .eq("category", category)
    .maybeSingle();

  let error = null;

  if (data) {
    const result = await supabaseClient
      .from("category_budgets")
      .update({ limit_amount })
      .eq("id", data.id);

    error = result.error;
  } else {
    const result = await supabaseClient
      .from("category_budgets")
      .insert({ telegram_id: state.telegramId, month_key, category, limit_amount });

    error = result.error;
  }

  if (error) {
    console.error(error);
    alert("Ошибка сохранения лимита");
    return;
  }

  categoryBudgetAmountEl.value = "";
  await loadBudgets();
  renderAll();
}

async function saveRecurringPayment() {
  const title = recurringTitleEl.value.trim();
  const amount = Number(recurringAmountEl.value);
  const category = recurringCategoryEl.value;
  const day_of_month = Number(recurringDayEl.value);
  const comment = recurringCommentEl.value.trim();

  if (!title || !amount || amount <= 0 || !day_of_month || day_of_month < 1 || day_of_month > 31) {
    alert("Заполни корректно все поля");
    return;
  }

  const { error } = await supabaseClient
    .from("recurring_payments")
    .insert({
      telegram_id: state.telegramId,
      title,
      amount,
      category,
      day_of_month,
      comment,
      is_active: true
    });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения регулярного платежа");
    return;
  }

  recurringTitleEl.value = "";
  recurringAmountEl.value = "";
  recurringDayEl.value = "";
  recurringCommentEl.value = "";

  closeModal(recurringModal);
  await loadRecurring();
  renderAll();
}

async function applyRecurringPayment(item) {
  const { error } = await supabaseClient
    .from("finance_records")
    .insert({
      telegram_id: state.telegramId,
      record_type: "expense",
      amount: item.amount,
      category: item.category,
      comment: item.comment || `Регулярный платеж: ${item.title}`
    });

  if (error) {
    console.error(error);
    alert("Ошибка добавления платежа");
    return;
  }

  await loadFinance();
  renderAll();
}

async function saveGoal() {
  const title = goalTitleEl.value.trim();
  const target_amount = Number(goalTargetAmountEl.value);

  if (!title || !target_amount || target_amount <= 0) {
    alert("Заполни цель корректно");
    return;
  }

  const { error } = await supabaseClient
    .from("saving_goals")
    .insert({
      telegram_id: state.telegramId,
      title,
      target_amount,
      current_amount: 0
    });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения цели");
    return;
  }

  goalTitleEl.value = "";
  goalTargetAmountEl.value = "";

  closeModal(goalModal);
  await loadGoals();
  renderAll();
}

async function savePlannerTask() {
  const title = plannerTitleEl.value.trim();
  const period_type = plannerPeriodEl.value;
  const due_date = plannerDateEl.value || null;

  if (!title) {
    alert("Введите название задачи");
    return;
  }

  const { error } = await supabaseClient
    .from("planner_tasks")
    .insert({
      telegram_id: state.telegramId,
      title,
      period_type,
      due_date,
      is_done: false
    });

  if (error) {
    console.error(error);
    alert("Ошибка сохранения задачи");
    return;
  }

  plannerTitleEl.value = "";
  plannerDateEl.value = "";

  closeModal(plannerModal);
  await loadPlanner();
  renderAll();
}

async function togglePlannerTask(id) {
  const item = state.planner.find(t => t.id === Number(id));
  if (!item) return;

  const { error } = await supabaseClient
    .from("planner_tasks")
    .update({ is_done: !item.is_done })
    .eq("id", id)
    .eq("telegram_id", state.telegramId);

  if (error) {
    console.error(error);
    alert("Ошибка обновления задачи");
    return;
  }

  await loadPlanner();
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

  const { error } = await supabaseClient
    .from("food_records")
    .insert({ telegram_id: state.telegramId, meal_type, title, calories });

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

  const { error } = await supabaseClient
    .from("sport_records")
    .insert({ telegram_id: state.telegramId, activity_type, activity_value });

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
  try {
    initTelegramUser();
    fillCategoryFilter();
    fillCategoryBudgetSelect();
    fillRecurringCategorySelect();
    await ensureProfile();
    await loadFinance();
    await loadFood();
    await loadSport();
    await loadBudgets();
    await loadRecurring();
    await loadGoals();
    await loadPlanner();
    renderAll();
  } catch (error) {
    console.error("initApp fatal error", error);
    if (userInfoEl) userInfoEl.textContent = "Ошибка загрузки приложения";
  }
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const section = document.getElementById(tab.dataset.tab);
    if (section) section.classList.add("active");
  });
});

document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const modal = document.getElementById(btn.dataset.close);
    if (modal) closeModal(modal);
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

    if (customPeriodBoxEl) {
      if (state.periodFilter === "custom") {
        customPeriodBoxEl.classList.remove("hidden");
      } else {
        customPeriodBoxEl.classList.add("hidden");
        renderAll();
      }
    }
  });
});

if (applyCustomPeriodBtn) {
  applyCustomPeriodBtn.addEventListener("click", () => {
    state.customDateFrom = dateFromEl.value;
    state.customDateTo = dateToEl.value;
    renderAll();
  });
}

if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    state.searchQuery = searchInputEl.value;
    renderOperations();
  });
}

if (categoryFilterEl) {
  categoryFilterEl.addEventListener("change", () => {
    state.categoryFilter = categoryFilterEl.value;
    renderOperations();
  });
}

if (openIncomeBtn) openIncomeBtn.addEventListener("click", () => openFinanceModal("income"));
if (openExpenseBtn) openExpenseBtn.addEventListener("click", () => openFinanceModal("expense"));
if (openIncomeBtn2) openIncomeBtn2.addEventListener("click", () => openFinanceModal("income"));
if (openExpenseBtn2) openExpenseBtn2.addEventListener("click", () => openFinanceModal("expense"));

if (openFoodBtn) openFoodBtn.addEventListener("click", () => openModal(foodModal));
if (foodAddBtn) foodAddBtn.addEventListener("click", () => openModal(foodModal));

if (openSportBtn) openSportBtn.addEventListener("click", () => openModal(sportModal));
if (sportAddBtn) sportAddBtn.addEventListener("click", () => openModal(sportModal));

if (openRecurringBtn) openRecurringBtn.addEventListener("click", () => openModal(recurringModal));
if (openGoalBtn) openGoalBtn.addEventListener("click", () => openModal(goalModal));
if (openPlannerBtn) openPlannerBtn.addEventListener("click", () => openModal(plannerModal));

if (openFinanceFiltersBtn) openFinanceFiltersBtn.addEventListener("click", () => openModal(financeFiltersModal));
if (openBudgetBtn) openBudgetBtn.addEventListener("click", () => openModal(budgetModal));
if (openCategoryBudgetBtn) openCategoryBudgetBtn.addEventListener("click", () => openModal(categoryBudgetModal));
if (openFinanceHistoryBtn) openFinanceHistoryBtn.addEventListener("click", () => openModal(financeHistoryModal));

if (saveFinanceBtn) saveFinanceBtn.addEventListener("click", saveFinance);
if (saveFoodBtn) saveFoodBtn.addEventListener("click", saveFood);
if (saveSportBtn) saveSportBtn.addEventListener("click", saveSport);
if (saveMonthlyBudgetBtn) saveMonthlyBudgetBtn.addEventListener("click", saveMonthlyBudget);
if (saveCategoryBudgetBtn) saveCategoryBudgetBtn.addEventListener("click", saveCategoryBudget);
if (saveRecurringBtn) saveRecurringBtn.addEventListener("click", saveRecurringPayment);
if (saveGoalBtn) saveGoalBtn.addEventListener("click", saveGoal);
if (savePlannerBtn) savePlannerBtn.addEventListener("click", savePlannerTask);

initApp();