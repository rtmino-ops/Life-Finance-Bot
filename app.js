// ===== TELEGRAM INIT =====
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) {
  tg.expand();
  tg.ready();
}

// ===== CATEGORIES =====
const incomeCategories = [
  { value: "salary", label: "💼 Зарплата" },
  { value: "parttime", label: "🔧 Подработка" },
  { value: "gift", label: "🎁 Подарки" },
  { value: "investment", label: "📈 Инвестиции" },
  { value: "other_income", label: "📦 Прочее" }
];

const expenseCategories = [
  { value: "food", label: "🍕 Еда" },
  { value: "transport", label: "🚗 Транспорт" },
  { value: "housing", label: "🏠 Жилье" },
  { value: "fun", label: "🎮 Развлечения" },
  { value: "health", label: "💊 Здоровье" },
  { value: "shopping", label: "🛍 Покупки" },
  { value: "sport", label: "🏋️ Спорт" },
  { value: "other_expense", label: "📦 Прочее" }
];

const categoryMap = {};
[...incomeCategories, ...expenseCategories].forEach(item => {
  categoryMap[item.value] = item.label;
});

// ===== PIE CHART COLORS =====
const PIE_COLORS_INCOME = ["#10b981","#34d399","#6ee7b7","#a7f3d0","#059669","#047857"];
const PIE_COLORS_EXPENSE = ["#ef4444","#f97316","#f59e0b","#eab308","#ec4899","#8b5cf6","#06b6d4","#64748b"];

// ===== DARK THEME =====
function initDarkTheme() {
  const tgColorScheme = tg && tg.colorScheme;
  const saved = localStorage.getItem("ml_theme");
  const isDark = saved ? saved === "dark" : tgColorScheme === "dark";
  if (isDark) document.body.classList.add("dark");
}


// ===== STATE =====
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
  plannerHistory: [],
  habits: [],
  habitLogs: [],
  reminderStates: [],
  financeFilter: "all",
  periodFilter: localStorage.getItem("ml_periodFilter") || "30",
  homePeriod: localStorage.getItem("ml_homePeriod") || "all",
  customDateFrom: null,
  customDateTo: null,
  searchQuery: "",
  categoryFilter: "all",
  monthlyBudget: 0,
  categoryBudgets: []
};

// ===== UTILITY FUNCTIONS =====
function formatMoney(amount) {
  return Number(amount).toLocaleString("ru-RU") + " ₽";
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function openModal(modal) {
  if (modal) modal.classList.remove("hidden");
}

function closeModal(modal) {
  if (modal) modal.classList.add("hidden");
}

// ===== DOM ELEMENTS =====
const $ = id => document.getElementById(id);

const userInfoEl = $("userInfo");
const balanceValueEl = $("balanceValue");
const incomeValueEl = $("incomeValue");
const expenseValueEl = $("expenseValue");
const caloriesValueEl = $("caloriesValue");
const sportCountValueEl = $("sportCountValue");
const remindersListEl = $("remindersList");

const periodIncomeValueEl = $("periodIncomeValue");
const periodExpenseValueEl = $("periodExpenseValue");
const periodBalanceValueEl = $("periodBalanceValue");

const summaryVisualChartEl = $("summaryVisualChart");
const incomeCategoryChartEl = $("incomeCategoryChart");
const expenseCategoryChartEl = $("expenseCategoryChart");

const monthlyBudgetInputEl = $("monthlyBudgetInput");
const monthlyBudgetValueEl = $("monthlyBudgetValue");
const monthlySpentValueEl = $("monthlySpentValue");
const monthlyLeftValueEl = $("monthlyLeftValue");
const monthlyBudgetBarEl = $("monthlyBudgetBar");
const budgetWarningEl = $("budgetWarning");

const categoryBudgetCategoryEl = $("categoryBudgetCategory");
const categoryBudgetAmountEl = $("categoryBudgetAmount");
const categoryBudgetListEl = $("categoryBudgetList");

const recurringListEl = $("recurringList");
const goalsListEl = $("goalsList");
const plannerListEl = $("plannerList");
const plannerHistoryListEl = $("plannerHistoryList");
const habitsListEl = $("habitsList");
const operationsListEl = $("operationsList");
const foodListEl = $("foodList");
const sportListEl = $("sportList");

const financeModal = $("financeModal");
const foodModal = $("foodModal");
const sportModal = $("sportModal");
const financeFiltersModal = $("financeFiltersModal");
const budgetModal = $("budgetModal");
const categoryBudgetModal = $("categoryBudgetModal");
const financeHistoryModal = $("financeHistoryModal");
const recurringModal = $("recurringModal");
const goalModal = $("goalModal");
const goalDepositModal = $("goalDepositModal");
const plannerModal = $("plannerModal");
const habitModal = $("habitModal");

const financeModalTitle = $("financeModalTitle");
const financeTypeInput = $("financeType");
const editingFinanceIdInput = $("editingFinanceId");
const financeAmountInput = $("financeAmount");
const financeCategoryInput = $("financeCategory");
const financeCommentInput = $("financeComment");

const foodTypeInput = $("foodType");
const foodNameInput = $("foodName");
const foodCaloriesInput = $("foodCalories");

const sportTypeInput = $("sportType");
const sportValueInput = $("sportValue");

const customPeriodBoxEl = $("customPeriodBox");
const dateFromEl = $("dateFrom");
const dateToEl = $("dateTo");

const searchInputEl = $("searchInput");
const categoryFilterEl = $("categoryFilter");

const recurringTitleEl = $("recurringTitle");
const recurringAmountEl = $("recurringAmount");
const recurringCategoryEl = $("recurringCategory");
const recurringDayEl = $("recurringDay");
const recurringCommentEl = $("recurringComment");

const goalTitleEl = $("goalTitle");
const goalTargetAmountEl = $("goalTargetAmount");

const plannerTitleEl = $("plannerTitle");
const plannerPeriodEl = $("plannerPeriod");
const plannerDateEl = $("plannerDate");

const habitTitleEl = $("habitTitle");
const habitPeriodEl = $("habitPeriod");
const habitTargetEl = $("habitTarget");

// ===== INIT =====
function initTelegramUser() {
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    state.telegramId = user.id;
    state.username = user.first_name || "Пользователь";
    if (userInfoEl) userInfoEl.textContent = `${state.username} • ID: ${state.telegramId}`;
  } else {
    state.telegramId = 999999;
    state.username = "Тест";
    if (userInfoEl) userInfoEl.textContent = `Тестовый режим`;
  }
}

// ===== FILL SELECTS =====
function fillFinanceCategories(type, selectedValue = null) {
  if (!financeCategoryInput) return;
  const list = type === "income" ? incomeCategories : expenseCategories;
  financeCategoryInput.innerHTML = list.map(item =>
    `<option value="${item.value}" ${selectedValue === item.value ? "selected" : ""}>${item.label}</option>`
  ).join("");
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

// ===== PERIOD HELPERS =====
function isInHomePeriod(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  if (state.homePeriod === "today") return date.toDateString() === now.toDateString();
  if (state.homePeriod === "week") {
    const from = new Date();
    from.setDate(now.getDate() - 7);
    return date >= from;
  }
  if (state.homePeriod === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true; // "all"
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

// ===== DATA LOADING =====
async function ensureProfile() {
  if (!supabaseClient || !state.telegramId) return;
  const { data } = await supabaseClient
    .from("profiles").select("*").eq("id", state.telegramId).maybeSingle();
  if (!data) {
    await supabaseClient.from("profiles").insert({ id: state.telegramId, username: state.username });
  }
}

async function loadFinance() {
  const { data, error } = await supabaseClient
    .from("finance_records").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.operations = data || [];
}

async function loadFood() {
  const { data, error } = await supabaseClient
    .from("food_records").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.food = data || [];
}

async function loadSport() {
  const { data, error } = await supabaseClient
    .from("sport_records").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.sport = data || [];
}

async function loadBudgets() {
  const monthKey = getMonthKey();
  const { data: budgetData } = await supabaseClient
    .from("budgets").select("*").eq("telegram_id", state.telegramId)
    .eq("month_key", monthKey).maybeSingle();
  state.monthlyBudget = budgetData ? Number(budgetData.total_budget) : 0;

  const { data: categoryData } = await supabaseClient
    .from("category_budgets").select("*").eq("telegram_id", state.telegramId)
    .eq("month_key", monthKey);
  state.categoryBudgets = categoryData || [];
}

async function loadRecurring() {
  const { data } = await supabaseClient
    .from("recurring_payments").select("*").eq("telegram_id", state.telegramId)
    .eq("is_active", true).order("day_of_month", { ascending: true });
  state.recurring = data || [];
}

async function loadGoals() {
  const { data } = await supabaseClient
    .from("saving_goals").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  state.goals = data || [];
}

async function loadPlanner() {
  const { data } = await supabaseClient
    .from("planner_tasks").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  state.planner = data || [];
}

async function loadPlannerHistory() {
  const { data } = await supabaseClient
    .from("planner_task_logs").select("*").eq("telegram_id", state.telegramId)
    .order("completed_at", { ascending: false });
  state.plannerHistory = data || [];
}

async function loadHabits() {
  const { data } = await supabaseClient
    .from("habits").select("*").eq("telegram_id", state.telegramId)
    .eq("is_active", true).order("created_at", { ascending: false });
  state.habits = data || [];
}

async function loadHabitLogs() {
  const { data } = await supabaseClient
    .from("habit_logs").select("*").eq("telegram_id", state.telegramId)
    .order("created_at", { ascending: false });
  state.habitLogs = data || [];
}

async function loadReminderStates() {
  const today = getTodayDateString();
  const { data } = await supabaseClient
    .from("reminder_states").select("*").eq("telegram_id", state.telegramId)
    .eq("action_date", today);
  state.reminderStates = data || [];
}

// ===== COMPUTED =====
function computeSummary() {
  const ops = state.operations.filter(i => isInHomePeriod(i.created_at));
  state.income = ops.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  state.expense = ops.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
  state.balance = state.income - state.expense;

  const today = getTodayDateString();
  state.calories = state.food
    .filter(i => i.created_at && i.created_at.startsWith(today))
    .reduce((s, i) => s + Number(i.calories || 0), 0);

  state.sportCount = state.sport
    .filter(i => isInHomePeriod(i.created_at))
    .length;
}

function getFilteredOperations() {
  let ops = [...state.operations];
  if (state.financeFilter !== "all") ops = ops.filter(i => i.record_type === state.financeFilter);
  ops = ops.filter(i => isInSelectedPeriod(i.created_at));
  if (state.categoryFilter !== "all") ops = ops.filter(i => i.category === state.categoryFilter);
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    ops = ops.filter(i => {
      const comment = (i.comment || "").toLowerCase();
      const catLabel = (categoryMap[i.category] || "").toLowerCase();
      return comment.includes(q) || catLabel.includes(q);
    });
  }
  return ops;
}

function getPeriodOperations() {
  return state.operations.filter(i => isInSelectedPeriod(i.created_at));
}

function getGroupedByCategory(recordType) {
  const grouped = {};
  getPeriodOperations().filter(i => i.record_type === recordType).forEach(i => {
    grouped[i.category] = (grouped[i.category] || 0) + Number(i.amount);
  });
  return grouped;
}

function getHabitProgress(habit) {
  const today = new Date();
  let logs = state.habitLogs.filter(l => Number(l.habit_id) === Number(habit.id));
  if (habit.period_type === "day") {
    logs = logs.filter(l => l.log_date === getTodayDateString());
  } else if (habit.period_type === "week") {
    const from = new Date();
    from.setDate(today.getDate() - 7);
    logs = logs.filter(l => new Date(l.log_date) >= from);
  } else if (habit.period_type === "month") {
    const mk = getMonthKey();
    logs = logs.filter(l => {
      const d = new Date(l.log_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
    });
  }
  return logs.length;
}

function hasReminderState(type, key) {
  return state.reminderStates.some(i => i.reminder_type === type && i.reminder_key === key);
}

async function setReminderState(type, key, actionType) {
  await supabaseClient.from("reminder_states").insert({
    telegram_id: state.telegramId,
    reminder_type: type,
    reminder_key: key,
    action_type: actionType,
    action_date: getTodayDateString()
  });
  await loadReminderStates();
}

// ===== RENDER =====
function renderSummary() {
  computeSummary();
  if (balanceValueEl) balanceValueEl.textContent = formatMoney(state.balance);
  if (incomeValueEl) incomeValueEl.textContent = formatMoney(state.income);
  if (expenseValueEl) expenseValueEl.textContent = formatMoney(state.expense);
  if (caloriesValueEl) caloriesValueEl.textContent = state.calories + " ккал";
  if (sportCountValueEl) sportCountValueEl.textContent = state.sportCount;
}

function renderOperations() {
  if (!operationsListEl) return;
  const ops = getFilteredOperations();
  if (!ops.length) {
    operationsListEl.innerHTML = '<div class="empty-state">Нет операций</div>';
    return;
  }
  operationsListEl.innerHTML = ops.map(item => `
    <div class="operation-item">
      <div class="operation-top">
        <div>
          <div class="operation-type ${item.record_type}">
            ${item.record_type === "income" ? "↗ Доход" : "↘ Расход"} — ${formatMoney(item.amount)}
          </div>
          <div class="operation-date">${formatDate(item.created_at)}</div>
        </div>
      </div>
      <div class="operation-meta">
        ${categoryMap[item.category] || item.category}${item.comment ? " • " + item.comment : ""}
      </div>
      <div class="operation-actions">
        <button class="edit-btn" data-edit-id="${item.id}">✏️</button>
        <button class="delete-btn" data-id="${item.id}" data-kind="finance">🗑</button>
      </div>
    </div>
  `).join("");

  operationsListEl.querySelectorAll('[data-kind="finance"]').forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить эту запись?")) return;
      await deleteFinanceRecord(btn.dataset.id);
    });
  });

  operationsListEl.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = state.operations.find(op => op.id === Number(btn.dataset.editId));
      if (item) openEditFinanceModal(item);
    });
  });
}

function renderFood() {
  if (!foodListEl) return;
  if (!state.food.length) {
    foodListEl.innerHTML = '<div class="empty-state">Нет записей</div>';
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
      <div class="operation-meta">${item.calories || 0} ккал</div>
      <div class="operation-actions">
        <button class="delete-btn" data-food-del="${item.id}">🗑 Удалить</button>
      </div>
    </div>
  `).join("");

  foodListEl.querySelectorAll("[data-food-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить запись о еде?")) return;
      await supabaseClient.from("food_records").delete()
        .eq("id", btn.dataset.foodDel).eq("telegram_id", state.telegramId);
      await loadFood();
      showToast("Запись удалена", "success");
      renderAll();
    });
  });
}

function renderSport() {
  if (!sportListEl) return;
  if (!state.sport.length) {
    sportListEl.innerHTML = '<div class="empty-state">Нет записей</div>';
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
      <div class="operation-actions">
        <button class="delete-btn" data-sport-del="${item.id}">🗑 Удалить</button>
      </div>
    </div>
  `).join("");

  sportListEl.querySelectorAll("[data-sport-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить тренировку?")) return;
      await supabaseClient.from("sport_records").delete()
        .eq("id", btn.dataset.sportDel).eq("telegram_id", state.telegramId);
      await loadSport();
      showToast("Тренировка удалена", "success");
      renderAll();
    });
  });
}

function renderPeriodAnalytics() {
  const ops = getPeriodOperations();
  const pIncome = ops.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const pExpense = ops.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
  if (periodIncomeValueEl) periodIncomeValueEl.textContent = formatMoney(pIncome);
  if (periodExpenseValueEl) periodExpenseValueEl.textContent = formatMoney(pExpense);
  if (periodBalanceValueEl) periodBalanceValueEl.textContent = formatMoney(pIncome - pExpense);
}

function renderVisualSummaryChart() {
  if (!summaryVisualChartEl) return;
  const ops = getPeriodOperations();
  const income = ops.filter(i => i.record_type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const expense = ops.filter(i => i.record_type === "expense").reduce((s, i) => s + Number(i.amount), 0);
  const total = income + expense;
  const ip = total > 0 ? (income / total) * 100 : 0;
  const ep = total > 0 ? (expense / total) * 100 : 0;

  summaryVisualChartEl.innerHTML = `
    <div class="chart-row">
      <div class="chart-row-label"><span>Доходы</span><strong>${formatMoney(income)}</strong></div>
      <div class="chart-bar-bg"><div class="chart-bar-fill income" style="width:${ip}%"></div></div>
    </div>
    <div class="chart-row">
      <div class="chart-row-label"><span>Расходы</span><strong>${formatMoney(expense)}</strong></div>
      <div class="chart-bar-bg"><div class="chart-bar-fill expense" style="width:${ep}%"></div></div>
    </div>
  `;
}

function renderVisualCategoryChart(el, grouped, type) {
  if (!el) return;
  const entries = Object.entries(grouped);
  if (!entries.length) { el.innerHTML = '<div class="empty-state">Нет данных</div>'; return; }
  const max = Math.max(...entries.map(([, a]) => a));
  const cls = type === "income" ? "income" : "expense";
  el.innerHTML = entries.map(([cat, amount]) => `
    <div class="chart-row">
      <div class="chart-row-label"><span>${categoryMap[cat] || cat}</span><strong>${formatMoney(amount)}</strong></div>
      <div class="chart-bar-bg"><div class="chart-bar-fill ${cls}" style="width:${max > 0 ? (amount / max) * 100 : 0}%"></div></div>
    </div>
  `).join("");
}


// ===== PIE CHART — DONUT (categories) =====
function renderPieChart(el, grouped, type) {
  if (!el) return;
  const entries = Object.entries(grouped).sort(([,a],[,b]) => b - a);
  if (!entries.length) { el.innerHTML = '<div class="empty-state">Нет данных</div>'; return; }
  const total = entries.reduce((s,[,v]) => s + v, 0);
  const colors = type === "income" ? PIE_COLORS_INCOME : PIE_COLORS_EXPENSE;
  // Лимиты по категориям (только для расходов)
  const limitsMap = {};
  if (type === "expense") {
    state.categoryBudgets.forEach(b => {
      limitsMap[b.category] = Number(b.budget_amount || b.limit_amount || 0);
    });
  }
  const size = 180, cx = 90, cy = 90, r = 72, ir = 44;
  let angle = -Math.PI / 2;
  const slices = entries.map(([cat, amount], i) => {
    const a = (amount / total) * 2 * Math.PI;
    const ea = angle + a;
    const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle);
    const x2=cx+r*Math.cos(ea),   y2=cy+r*Math.sin(ea);
    const ix1=cx+ir*Math.cos(angle),iy1=cy+ir*Math.sin(angle);
    const ix2=cx+ir*Math.cos(ea),  iy2=cy+ir*Math.sin(ea);
    const lg = a > Math.PI ? 1 : 0;
    const path = `M${ix1} ${iy1} L${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${ix2} ${iy2} A${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1}Z`;
    const col = colors[i % colors.length];
    angle = ea;
    return { cat, amount, col, path };
  });
  const svgPaths = slices.map(s=>`<path d="${s.path}" fill="${s.col}" stroke="white" stroke-width="1.5" opacity="0.93"/>`).join("");
  const legend = slices.map(s=>{
    const pct = Math.round((s.amount/total)*100);
    const lim = limitsMap && limitsMap[s.cat] ? limitsMap[s.cat] : 0;
    const limHtml = lim > 0 ? `<span class="pie-legend-limit ${s.amount > lim ? "over-limit" : ""}">${formatMoney(lim)}</span>` : "";
    return `<div class="pie-legend-item">
      <div class="pie-legend-left"><div class="pie-legend-dot" style="background:${s.col}"></div><span class="pie-legend-name">${categoryMap[s.cat]||s.cat}</span></div>
      <div class="pie-legend-right">${limHtml}<span class="pie-legend-amount">${formatMoney(s.amount)}</span><span class="pie-legend-pct">${pct}%</span></div>
    </div>`;
  }).join("");
  el.innerHTML = `<div class="pie-wrap">
    <div class="pie-canvas-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgPaths}</svg>
      <div class="pie-center-label"><span>${type==="income"?"Доходы":"Расходы"}</span><strong>${formatMoney(total)}</strong></div>
    </div>
    <div class="pie-legend">${legend}</div>
  </div>`;
}

// ===== PIE CHART — HALF DONUT (income vs expense) =====
function renderSummaryPieChart(el, income, expense, budget) {
  if (!el) return;
  const total = income + expense;
  if (total === 0) { el.innerHTML = '<div class="empty-state">Нет данных за период</div>'; return; }
  const size = 180, cx = 90, cy = 90, r = 72, ir = 44;
  // Full donut split income/expense
  const incomeAngle = (income / total) * 2 * Math.PI;
  const expenseAngle = (expense / total) * 2 * Math.PI;
  let angle = -Math.PI / 2;
  function slicePath(a, ea) {
    const x1=cx+r*Math.cos(a),   y1=cy+r*Math.sin(a);
    const x2=cx+r*Math.cos(ea),  y2=cy+r*Math.sin(ea);
    const ix1=cx+ir*Math.cos(a), iy1=cy+ir*Math.sin(a);
    const ix2=cx+ir*Math.cos(ea),iy2=cy+ir*Math.sin(ea);
    const lg = (ea-a) > Math.PI ? 1 : 0;
    return `M${ix1} ${iy1} L${x1} ${y1} A${r} ${r} 0 ${lg} 1 ${x2} ${y2} L${ix2} ${iy2} A${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1}Z`;
  }
  const incPath = slicePath(angle, angle + incomeAngle);
  const expPath = slicePath(angle + incomeAngle, angle + incomeAngle + expenseAngle);
  const balance = income - expense;
  const balColor = balance >= 0 ? "#10b981" : "#ef4444";

  // Budget bar
  let budgetHtml = "";
  if (budget > 0) {
    const pct = Math.min(Math.round((expense / budget) * 100), 100);
    const barColor = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";
    const warn = pct >= 100 ? "🚨 Бюджет превышен" : pct >= 80 ? "⚠️ 80%+ бюджета" : "";
    budgetHtml = `<div class="summary-pie-budget">
      <div class="summary-pie-budget-row">
        <span>Бюджет</span><strong>${formatMoney(budget)}</strong>
      </div>
      <div class="bar-bg" style="margin:6px 0 2px"><div class="bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
      <div class="summary-pie-budget-row"><span style="color:${barColor};font-size:12px">${warn||"Потрачено "+pct+"%"}</span><span style="font-size:12px;color:#6b7280">Осталось ${formatMoney(budget-expense)}</span></div>
    </div>`;
  }

  el.innerHTML = `<div class="summary-pie-wrap">
    <div class="pie-canvas-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <path d="${incPath}" fill="#10b981" stroke="white" stroke-width="1.5" opacity="0.93"/>
        <path d="${expPath}" fill="#ef4444" stroke="white" stroke-width="1.5" opacity="0.93"/>
      </svg>
      <div class="pie-center-label">
        <span>Баланс</span>
        <strong style="color:${balColor}">${formatMoney(balance)}</strong>
      </div>
    </div>
    <div class="summary-pie-info">
      <div class="summary-pie-row"><span class="summary-pie-dot" style="background:#10b981"></span><span>Доходы</span><strong>${formatMoney(income)}</strong></div>
      <div class="summary-pie-row"><span class="summary-pie-dot" style="background:#ef4444"></span><span>Расходы</span><strong>${formatMoney(expense)}</strong></div>
      ${budgetHtml}
    </div>
  </div>`;
}

function renderBudgetBlock() {
  if (!monthlyBudgetValueEl) return;
  const mk = getMonthKey();
  const monthExp = state.operations.filter(i => {
    const d = new Date(i.created_at);
    return i.record_type === "expense" &&
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
  });
  const spent = monthExp.reduce((s, i) => s + Number(i.amount), 0);
  const budget = Number(state.monthlyBudget || 0);
  const left = budget - spent;

  monthlyBudgetValueEl.textContent = formatMoney(budget);
  monthlySpentValueEl.textContent = formatMoney(spent);
  monthlyLeftValueEl.textContent = formatMoney(left);

  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  if (monthlyBudgetBarEl) monthlyBudgetBarEl.style.width = `${pct}%`;

  if (budgetWarningEl) {
    budgetWarningEl.classList.add("hidden");
    if (budget > 0 && spent >= budget) {
      budgetWarningEl.textContent = "⚠️ Бюджет превышен!";
      budgetWarningEl.classList.remove("hidden");
    } else if (budget > 0 && spent >= budget * 0.8) {
      budgetWarningEl.textContent = "⚠️ Использовано более 80% бюджета";
      budgetWarningEl.classList.remove("hidden");
    }
  }
}

function renderCategoryBudgets() {
  if (!categoryBudgetListEl) return;
  const mk = getMonthKey();
  const monthExp = state.operations.filter(i => {
    const d = new Date(i.created_at);
    return i.record_type === "expense" &&
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
  });

  if (!state.categoryBudgets.length) {
    categoryBudgetListEl.innerHTML = '<div class="empty-state">Лимиты не заданы</div>';
    return;
  }

  categoryBudgetListEl.innerHTML = state.categoryBudgets.map(item => {
    const spent = monthExp.filter(e => e.category === item.category).reduce((s, e) => s + Number(e.amount), 0);
    const limit = Number(item.budget_amount || item.limit_amount);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    return `
      <div class="budget-row">
        <div class="category-label">
          <span>${categoryMap[item.category] || item.category}</span>
          <strong>${formatMoney(spent)} / ${formatMoney(limit)}</strong>
        </div>
        <div class="category-bar"><div class="category-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderRecurring() {
  if (!recurringListEl) return;
  if (!state.recurring.length) {
    recurringListEl.innerHTML = '<div class="empty-state">Нет платежей</div>';
    return;
  }
  const isCollapsed = recurringListEl.dataset.collapsed === "true";
  const toggleBtn = `<button class="toggle-section-btn" id="recurringToggleBtn">${isCollapsed ? "▼ Показать платежи ("+state.recurring.length+")" : "▲ Свернуть"}</button>`;
  const itemsHtml = isCollapsed ? "" : state.recurring.map(item => `
    <div class="recurring-item">
      <strong>${item.title}</strong> — ${formatMoney(item.amount)}
      <br /><small>${categoryMap[item.category] || item.category} • ${item.day_of_month} числа</small>
      ${item.comment ? `<br /><small>${item.comment}</small>` : ""}
      <div class="recurring-actions">
        <button class="recurring-pay-btn" data-pay-id="${item.id}">✅ Оплатить</button>
        <button class="delete-btn" data-rec-del="${item.id}">🗑</button>
      </div>
    </div>
  `).join("");
  recurringListEl.innerHTML = toggleBtn + itemsHtml;
  const tb = document.getElementById("recurringToggleBtn");
  if (tb) tb.addEventListener("click", () => {
    recurringListEl.dataset.collapsed = recurringListEl.dataset.collapsed === "true" ? "false" : "true";
    renderRecurring();
  });

  recurringListEl.querySelectorAll("[data-pay-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const item = state.recurring.find(x => x.id === Number(btn.dataset.payId));
      if (item) await applyRecurringPayment(item);
    });
  });

  recurringListEl.querySelectorAll("[data-rec-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить платеж?")) return;
      await supabaseClient.from("recurring_payments").update({ is_active: false })
        .eq("id", btn.dataset.recDel).eq("telegram_id", state.telegramId);
      await loadRecurring();
      showToast("Платеж удалён");
      renderAll();
    });
  });
}

function renderGoals() {
  if (!goalsListEl) return;
  if (!state.goals.length) {
    goalsListEl.innerHTML = '<div class="empty-state">Нет целей</div>';
    return;
  }
  goalsListEl.innerHTML = state.goals.map(item => {
    const pct = item.target_amount > 0
      ? Math.min((Number(item.current_amount) / Number(item.target_amount)) * 100, 100) : 0;
    return `
      <div class="goal-row">
        <div class="category-label">
          <span>${item.title}</span>
          <strong>${formatMoney(item.current_amount)} / ${formatMoney(item.target_amount)}</strong>
        </div>
        <div class="category-bar"><div class="category-bar-fill" style="width:${pct}%"></div></div>
        <div class="goal-actions">
          <button class="goal-deposit-btn" data-goal-id="${item.id}">💰 Внести</button>
          <button class="goal-delete-btn" data-goal-del="${item.id}">🗑</button>
        </div>
      </div>
    `;
  }).join("");

  goalsListEl.querySelectorAll("[data-goal-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const goal = state.goals.find(g => g.id === Number(btn.dataset.goalId));
      if (goal) openGoalDeposit(goal);
    });
  });

  goalsListEl.querySelectorAll("[data-goal-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить цель?")) return;
      await supabaseClient.from("saving_goals").delete()
        .eq("id", btn.dataset.goalDel).eq("telegram_id", state.telegramId);
      await loadGoals();
      showToast("Цель удалена");
      renderAll();
    });
  });
}

function renderPlanner() {
  if (!plannerListEl) return;
  const active = state.planner.filter(i => !i.is_done);
  if (!active.length) {
    plannerListEl.innerHTML = '<div class="empty-state">Нет задач</div>';
    return;
  }
  plannerListEl.innerHTML = active.map(item => `
    <div class="task-row">
      <div class="task-top">
        <div>
          <div class="operation-type">${item.title}</div>
          <div class="operation-date">${item.period_type} • ${item.due_date || "без срока"}</div>
        </div>
        <div class="operation-actions">
          <button class="done-btn" data-task-id="${item.id}">✅</button>
          <button class="delete-btn" data-task-del="${item.id}">🗑</button>
        </div>
      </div>
    </div>
  `).join("");

  plannerListEl.querySelectorAll("[data-task-id]").forEach(btn => {
    btn.addEventListener("click", async () => await completePlannerTask(btn.dataset.taskId));
  });

  plannerListEl.querySelectorAll("[data-task-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить задачу?")) return;
      await deletePlannerTask(btn.dataset.taskDel);
    });
  });
}

function renderPlannerHistory() {
  if (!plannerHistoryListEl) return;
  if (!state.plannerHistory.length) {
    plannerHistoryListEl.innerHTML = '<div class="empty-state">Нет выполненных</div>';
    return;
  }
  const isCollapsed = plannerHistoryListEl.dataset.collapsed === "true";
  const toggleBtn = `<button class="toggle-section-btn" id="historyToggleBtn">${isCollapsed ? "▼ Показать историю ("+state.plannerHistory.length+")" : "▲ Свернуть"}</button>`;
  const itemsHtml = isCollapsed ? "" : state.plannerHistory.slice(0, 30).map(item => `
    <div class="task-row done">
      <div class="task-top">
        <div style="flex:1">
          <div class="operation-type">✅ ${item.title}</div>
          <div class="operation-date">${item.period_type} • ${formatDate(item.completed_at)}</div>
        </div>
        <button class="delete-btn" style="padding:6px 10px;font-size:12px" data-hist-del="${item.id}">🗑</button>
      </div>
    </div>
  `).join("");
  plannerHistoryListEl.innerHTML = toggleBtn + itemsHtml;
  const tb = document.getElementById("historyToggleBtn");
  if (tb) tb.addEventListener("click", () => {
    plannerHistoryListEl.dataset.collapsed = plannerHistoryListEl.dataset.collapsed === "true" ? "false" : "true";
    renderPlannerHistory();
  });
  plannerHistoryListEl.querySelectorAll("[data-hist-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить из истории?")) return;
      await supabaseClient.from("planner_task_logs").delete()
        .eq("id", btn.dataset.histDel).eq("telegram_id", state.telegramId);
      await loadPlannerHistory();
      showToast("Удалено из истории");
      renderPlannerHistory();
    });
  });
}

function renderHabits() {
  if (!habitsListEl) return;
  if (!state.habits.length) {
    habitsListEl.innerHTML = '<div class="empty-state">Нет привычек</div>';
    return;
  }
  habitsListEl.innerHTML = state.habits.map(habit => {
    const done = getHabitProgress(habit);
    const pct = habit.target_count > 0 ? Math.min((done / habit.target_count) * 100, 100) : 0;
    return `
      <div class="habit-row">
        <div class="category-label">
          <span>${habit.title}</span>
          <strong>${done} / ${habit.target_count}</strong>
        </div>
        <div class="operation-date">${habit.period_type}</div>
        <div class="category-bar"><div class="category-bar-fill" style="width:${pct}%"></div></div>
        <div class="habit-actions" style="margin-top:10px;">
          <button class="habit-log-btn" data-habit-id="${habit.id}">✅ Отметить</button>
          <button class="delete-btn" data-habit-del="${habit.id}">🗑</button>
        </div>
      </div>
    `;
  }).join("");

  habitsListEl.querySelectorAll("[data-habit-id]").forEach(btn => {
    btn.addEventListener("click", async () => await logHabitCompletion(btn.dataset.habitId));
  });

  habitsListEl.querySelectorAll("[data-habit-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Удалить привычку?")) return;
      await supabaseClient.from("habits").update({ is_active: false })
        .eq("id", btn.dataset.habitDel).eq("telegram_id", state.telegramId);
      await loadHabits();
      showToast("Привычка удалена");
      renderAll();
    });
  });
}

// ===== REMINDERS =====
function buildReminderCards() {
  const reminders = [];
  const today = new Date();
  const todayDate = today.getDate();
  const mk = getMonthKey();

  state.recurring.forEach(item => {
    const key = `payment-${item.id}-${mk}`;
    if (hasReminderState("payment", key)) return;
    if (item.day_of_month === todayDate || (item.day_of_month > todayDate && item.day_of_month - todayDate <= 3)) {
      reminders.push({
        priority: 1, type: "payment", key,
        title: item.day_of_month === todayDate
          ? `💳 Сегодня: ${item.title} — ${formatMoney(item.amount)}`
          : `💳 Скоро: ${item.title} (${item.day_of_month} числа)`,
        payload: item
      });
    }
  });

  if (state.monthlyBudget > 0) {
    const monthExp = state.operations.filter(i => {
      const d = new Date(i.created_at);
      return i.record_type === "expense" &&
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === mk;
    });
    const spent = monthExp.reduce((s, i) => s + Number(i.amount), 0);
    if (spent >= state.monthlyBudget) {
      const key = `budget-${mk}-100`;
      if (!hasReminderState("budget", key)) {
        reminders.push({ priority: 2, type: "budget", key, title: "🚨 Бюджет превышен!", payload: null });
      }
    } else if (spent >= state.monthlyBudget * 0.8) {
      const key = `budget-${mk}-80`;
      if (!hasReminderState("budget", key)) {
        reminders.push({ priority: 3, type: "budget", key, title: "⚠️ Бюджет почти исчерпан", payload: null });
      }
    }
  }

  state.planner.filter(t => !t.is_done).forEach(task => {
    const key = `task-${task.id}`;
    if (hasReminderState("task", key)) return;
    let show = false;
    if (!task.due_date) show = true;
    else {
      const diff = Math.floor((new Date(task.due_date) - today) / 86400000);
      if (task.period_type === "day" && diff <= 0) show = true;
      if (task.period_type === "week" && diff <= 2) show = true;
      if (task.period_type === "month" && diff <= 5) show = true;
    }
    if (show) {
      reminders.push({ priority: 2, type: "task", key, title: `📋 ${task.title}`, payload: task });
    }
  });

  state.habits.forEach(habit => {
    const done = getHabitProgress(habit);
    if (done >= habit.target_count) return;
    const key = `habit-${habit.id}-${getTodayDateString()}`;
    if (hasReminderState("habit", key)) return;
    let show = false;
    if (habit.period_type === "day") show = done < habit.target_count;
    if (habit.period_type === "week") {
      const dow = today.getDay() === 0 ? 7 : today.getDay();
      show = done < Math.floor((habit.target_count / 7) * dow);
    }
    if (habit.period_type === "month") {
      const dom = today.getDate();
      const dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      show = done < Math.floor((habit.target_count / dim) * dom);
    }
    if (show) {
      reminders.push({
        priority: 4, type: "habit", key,
        title: `🔁 ${habit.title} (${done}/${habit.target_count})`,
        payload: habit
      });
    }
  });

  return reminders.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

function renderReminders() {
  if (!remindersListEl) return;
  const reminders = buildReminderCards();
  if (!reminders.length) {
    remindersListEl.innerHTML = '<div class="empty-state">Нет напоминаний 🎉</div>';
    return;
  }

  remindersListEl.innerHTML = reminders.map(item => {
    let buttons = "";
    if (item.type === "payment") {
      buttons = `<div class="reminder-actions">
        <button class="reminder-btn-done" data-ra="payment-done" data-rk="${item.key}" data-ri="${item.payload.id}">✅</button>
        <button class="reminder-btn-later" data-ra="later" data-rk="${item.key}" data-rt="payment">⏰</button>
      </div>`;
    } else if (item.type === "task") {
      buttons = `<div class="reminder-actions">
        <button class="reminder-btn-done" data-ra="task-done" data-rk="${item.key}" data-ri="${item.payload.id}">✅</button>
        <button class="reminder-btn-later" data-ra="later" data-rk="${item.key}" data-rt="task">⏰</button>
        <button class="reminder-btn-hide" data-ra="dismiss" data-rk="${item.key}" data-rt="task">✕</button>
      </div>`;
    } else if (item.type === "habit") {
      buttons = `<div class="reminder-actions">
        <button class="reminder-btn-done" data-ra="habit-done" data-rk="${item.key}" data-ri="${item.payload.id}">✅</button>
        <button class="reminder-btn-hide" data-ra="dismiss" data-rk="${item.key}" data-rt="habit">✕</button>
      </div>`;
    } else if (item.type === "budget") {
      buttons = `<div class="reminder-actions">
        <button class="reminder-btn-hide" data-ra="dismiss" data-rk="${item.key}" data-rt="budget">OK</button>
      </div>`;
    }
    return `<div class="reminder-item"><div>${item.title}</div>${buttons}</div>`;
  }).join("");

  remindersListEl.querySelectorAll("[data-ra]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.ra;
      const key = btn.dataset.rk;
      const type = btn.dataset.rt;
      const id = btn.dataset.ri;

      if (action === "payment-done") {
        const item = state.recurring.find(x => x.id === Number(id));
        if (item) { await applyRecurringPayment(item); await setReminderState("payment", key, "done"); }
      } else if (action === "task-done") {
        await completePlannerTask(id);
        await setReminderState("task", key, "done");
      } else if (action === "habit-done") {
        await logHabitCompletion(id);
        await setReminderState("habit", key, "done");
      } else if (action === "later") {
        await setReminderState(type, key, "later");
      } else if (action === "dismiss") {
        await setReminderState(type, key, "dismissed");
      }
      renderAll();
    });
  });
}

function renderAll() {
  renderSummary();
  renderOperations();
  renderFood();
  renderSport();
  renderPeriodAnalytics();
  renderSummaryPieChart(summaryVisualChartEl, state.income, state.expense, state.monthlyBudget);
  renderPieChart(incomeCategoryChartEl, getGroupedByCategory("income"), "income");
  renderPieChart(expenseCategoryChartEl, getGroupedByCategory("expense"), "expense");
  renderBudgetBlock();
  renderCategoryBudgets();
  renderRecurring();
  renderGoals();
  renderPlanner();
  renderPlannerHistory();
  renderHabits();
  renderReminders();
}

// ===== ACTIONS =====
function openFinanceModal(type) {
  financeTypeInput.value = type;
  editingFinanceIdInput.value = "";
  financeModalTitle.textContent = type === "income" ? "💰 Добавить доход" : "💸 Добавить расход";
  financeAmountInput.value = "";
  financeCommentInput.value = "";
  fillFinanceCategories(type);
  openModal(financeModal);
  setTimeout(() => financeAmountInput && financeAmountInput.focus(), 100);
}

function openEditFinanceModal(item) {
  financeTypeInput.value = item.record_type;
  editingFinanceIdInput.value = item.id;
  financeModalTitle.textContent = "✏️ Редактировать";
  financeAmountInput.value = item.amount;
  financeCommentInput.value = item.comment || "";
  fillFinanceCategories(item.record_type, item.category);
  openModal(financeModal);
}

function openGoalDeposit(goal) {
  $("goalDepositId").value = goal.id;
  $("goalDepositInfo").textContent = `${goal.title}: ${formatMoney(goal.current_amount)} / ${formatMoney(goal.target_amount)}`;
  $("goalDepositAmount").value = "";
  openModal(goalDepositModal);
}

async function saveFinance() {
  const id = editingFinanceIdInput.value;
  const type = financeTypeInput.value;
  const amount = Number(financeAmountInput.value);
  const category = financeCategoryInput.value;
  const comment = financeCommentInput.value.trim();

  if (!amount || amount <= 0) { showToast("Введите сумму", "error"); return; }

  let error;
  if (id) {
    error = (await supabaseClient.from("finance_records")
      .update({ record_type: type, amount, category, comment })
      .eq("id", id).eq("telegram_id", state.telegramId)).error;
  } else {
    error = (await supabaseClient.from("finance_records")
      .insert({ telegram_id: state.telegramId, record_type: type, amount, category, comment })).error;
  }

  if (error) { showToast("Ошибка сохранения", "error"); return; }
  closeModal(financeModal);
  await loadFinance();
  showToast(id ? "Запись обновлена" : "Запись добавлена");
  renderAll();
}

async function deleteFinanceRecord(id) {
  const { error } = await supabaseClient.from("finance_records").delete()
    .eq("id", id).eq("telegram_id", state.telegramId);
  if (error) { showToast("Ошибка удаления", "error"); return; }
  await loadFinance();
  showToast("Запись удалена");
  renderAll();
}

async function saveMonthlyBudget() {
  const total_budget = Number(monthlyBudgetInputEl.value);
  const month_key = getMonthKey();
  if (!total_budget || total_budget <= 0) { showToast("Введите бюджет", "error"); return; }

  const { data } = await supabaseClient.from("budgets").select("*")
    .eq("telegram_id", state.telegramId).eq("month_key", month_key).maybeSingle();

  const error = data
    ? (await supabaseClient.from("budgets").update({ total_budget }).eq("id", data.id)).error
    : (await supabaseClient.from("budgets").insert({ telegram_id: state.telegramId, month_key, total_budget })).error;

  if (error) { showToast("Ошибка", "error"); return; }
  monthlyBudgetInputEl.value = "";
  await loadBudgets();
  showToast("Бюджет сохранён");
  renderAll();
}

async function saveCategoryBudget() {
  const category = categoryBudgetCategoryEl.value;
  const budget_amount = Number(categoryBudgetAmountEl.value);
  const month_key = getMonthKey();
  if (!budget_amount || budget_amount <= 0) { showToast("Введите лимит", "error"); return; }

  const { data } = await supabaseClient.from("category_budgets").select("*")
    .eq("telegram_id", state.telegramId).eq("month_key", month_key).eq("category", category).maybeSingle();

  const error = data
    ? (await supabaseClient.from("category_budgets").update({ budget_amount }).eq("id", data.id)).error
    : (await supabaseClient.from("category_budgets").insert({ telegram_id: state.telegramId, month_key, category, budget_amount })).error;

  if (error) { showToast("Ошибка", "error"); return; }
  categoryBudgetAmountEl.value = "";
  await loadBudgets();
  showToast("Лимит сохранён");
  renderAll();
}

async function saveRecurringPayment() {
  const title = recurringTitleEl.value.trim();
  const amount = Number(recurringAmountEl.value);
  const category = recurringCategoryEl.value;
  const day_of_month = Number(recurringDayEl.value);
  const comment = recurringCommentEl.value.trim();

  if (!title || !amount || amount <= 0 || !day_of_month || day_of_month < 1 || day_of_month > 31) {
    showToast("Заполни все поля", "error"); return;
  }

  const { error } = await supabaseClient.from("recurring_payments").insert({
    telegram_id: state.telegramId, title, amount, category, day_of_month, comment, is_active: true
  });

  if (error) { showToast("Ошибка", "error"); return; }
  recurringTitleEl.value = "";
  recurringAmountEl.value = "";
  recurringDayEl.value = "";
  recurringCommentEl.value = "";
  await loadRecurring();
  showToast("Платеж добавлен");
  renderAll();
}

async function applyRecurringPayment(item) {
  const { error } = await supabaseClient.from("finance_records").insert({
    telegram_id: state.telegramId,
    record_type: "expense",
    amount: item.amount,
    category: item.category,
    comment: `🔄 ${item.title}`
  });
  if (error) { showToast("Ошибка", "error"); return; }
  await loadFinance();
  showToast(`Оплачено: ${item.title}`);
  renderAll();
}

async function saveGoal() {
  const title = goalTitleEl.value.trim();
  const target_amount = Number(goalTargetAmountEl.value);
  if (!title || !target_amount || target_amount <= 0) { showToast("Заполни цель", "error"); return; }

  const { error } = await supabaseClient.from("saving_goals").insert({
    telegram_id: state.telegramId, title, target_amount, current_amount: 0
  });
  if (error) { showToast("Ошибка", "error"); return; }
  goalTitleEl.value = "";
  goalTargetAmountEl.value = "";
  closeModal(goalModal);
  await loadGoals();
  showToast("Цель создана");
  renderAll();
}

async function saveGoalDeposit() {
  const id = $("goalDepositId").value;
  const amount = Number($("goalDepositAmount").value);
  if (!amount || amount <= 0) { showToast("Введите сумму", "error"); return; }

  const goal = state.goals.find(g => g.id === Number(id));
  if (!goal) return;

  const newAmount = Number(goal.current_amount) + amount;
  const { error } = await supabaseClient.from("saving_goals").update({ current_amount: newAmount })
    .eq("id", id).eq("telegram_id", state.telegramId);

  if (error) { showToast("Ошибка", "error"); return; }
  closeModal(goalDepositModal);
  await loadGoals();
  showToast(`+${formatMoney(amount)} к цели "${goal.title}"`);
  renderAll();
}

async function savePlannerTask() {
  const title = plannerTitleEl.value.trim();
  const period_type = plannerPeriodEl.value;
  const due_date = plannerDateEl.value || null;
  if (!title) { showToast("Введите задачу", "error"); return; }

  const { error } = await supabaseClient.from("planner_tasks").insert({
    telegram_id: state.telegramId, title, period_type, due_date, is_done: false
  });
  if (error) { showToast("Ошибка", "error"); return; }
  plannerTitleEl.value = "";
  plannerDateEl.value = "";
  closeModal(plannerModal);
  await loadPlanner();
  showToast("Задача добавлена");
  renderAll();
}

async function completePlannerTask(id) {
  const item = state.planner.find(t => t.id === Number(id));
  if (!item) return;

  await supabaseClient.from("planner_task_logs").insert({
    telegram_id: state.telegramId, task_id: item.id, title: item.title, period_type: item.period_type
  });
  await supabaseClient.from("planner_tasks").update({ is_done: true })
    .eq("id", id).eq("telegram_id", state.telegramId);

  await loadPlanner();
  await loadPlannerHistory();
  showToast(`✅ ${item.title}`);
  renderAll();
}

async function deletePlannerTask(id) {
  await supabaseClient.from("planner_tasks").delete()
    .eq("id", id).eq("telegram_id", state.telegramId);
  await loadPlanner();
  showToast("Задача удалена");
  renderAll();
}

async function saveHabit() {
  const title = habitTitleEl.value.trim();
  const period_type = habitPeriodEl.value;
  const target_count = Number(habitTargetEl.value);
  if (!title || !target_count || target_count <= 0) { showToast("Заполни привычку", "error"); return; }

  const { error } = await supabaseClient.from("habits").insert({
    telegram_id: state.telegramId, title, period_type, target_count, is_active: true
  });
  if (error) { showToast("Ошибка", "error"); return; }
  habitTitleEl.value = "";
  habitTargetEl.value = "";
  closeModal(habitModal);
  await loadHabits();
  showToast("Привычка добавлена");
  renderAll();
}

async function logHabitCompletion(habitId) {
  const today = getTodayDateString();
  const { data } = await supabaseClient.from("habit_logs").select("*")
    .eq("telegram_id", state.telegramId).eq("habit_id", habitId).eq("log_date", today);

  if (data && data.length) { showToast("Уже отмечено сегодня", "warning"); return; }

  const { error } = await supabaseClient.from("habit_logs").insert({
    telegram_id: state.telegramId, habit_id: habitId, log_date: today
  });
  if (error) { showToast("Ошибка", "error"); return; }
  await loadHabitLogs();
  showToast("Привычка отмечена! 💪");
  renderAll();
}

async function saveFood() {
  const meal_type = foodTypeInput.value;
  const title = foodNameInput.value.trim();
  const calories = Number(foodCaloriesInput.value || 0);
  if (!title) { showToast("Введите блюдо", "error"); return; }

  const { error } = await supabaseClient.from("food_records").insert({
    telegram_id: state.telegramId, meal_type, title, calories
  });
  if (error) { showToast("Ошибка", "error"); return; }
  foodNameInput.value = "";
  foodCaloriesInput.value = "";
  closeModal(foodModal);
  await loadFood();
  showToast("Еда добавлена 🍽");
  renderAll();
}

async function saveSport() {
  const activity_type = sportTypeInput.value.trim();
  const activity_value = sportValueInput.value.trim();
  if (!activity_type || !activity_value) { showToast("Заполни поля", "error"); return; }

  const { error } = await supabaseClient.from("sport_records").insert({
    telegram_id: state.telegramId, activity_type, activity_value
  });
  if (error) { showToast("Ошибка", "error"); return; }
  sportTypeInput.value = "";
  sportValueInput.value = "";
  closeModal(sportModal);
  await loadSport();
  showToast("Тренировка добавлена 💪");
  renderAll();
}

// ===== INIT APP =====
async function initApp() {
  try {
    initDarkTheme();
    initTelegramUser();
    fillCategoryFilter();
    fillCategoryBudgetSelect();
    fillRecurringCategorySelect();
    await ensureProfile();

    // Параллельная загрузка всех данных
    await Promise.all([
      loadFinance(),
      loadFood(),
      loadSport(),
      loadBudgets(),
      loadRecurring(),
      loadGoals(),
      loadPlanner(),
      loadPlannerHistory(),
      loadHabits(),
      loadHabitLogs(),
      loadReminderStates()
    ]);

    renderAll();
  } catch (error) {
    console.error("initApp error:", error);
    if (userInfoEl) userInfoEl.textContent = "Ошибка загрузки";
    showToast("Ошибка загрузки приложения", "error");
  }
}

// ===== EVENT LISTENERS =====

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
  const savedTab = localStorage.getItem("ml_activeTab") || "home";
  if (tab.dataset.tab === savedTab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const s = $(tab.dataset.tab);
    if (s) s.classList.add("active");
  }
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const s = $(tab.dataset.tab);
    if (s) s.classList.add("active");
    localStorage.setItem("ml_activeTab", tab.dataset.tab);
  });
});

// Home period selector
document.querySelectorAll(".home-period-btn").forEach(btn => {
  if (btn.dataset.homePeriod === state.homePeriod) {
    document.querySelectorAll(".home-period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    document.querySelectorAll(".home-period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.homePeriod = btn.dataset.homePeriod;
    localStorage.setItem("ml_homePeriod", state.homePeriod);
    renderAll();
  });
});


// Finance period selector (на вкладке Финансы)
document.querySelectorAll(".finance-period-btn").forEach(btn => {
  if (btn.dataset.fp === state.periodFilter) {
    document.querySelectorAll(".finance-period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    document.querySelectorAll(".finance-period-btn").forEach(b => b.classList.remove("active"));
    // Синхронизируем с period-btn в фильтрах
    document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.periodFilter = btn.dataset.fp;
    localStorage.setItem("ml_periodFilter", state.periodFilter);
    if (customPeriodBoxEl) customPeriodBoxEl.classList.add("hidden");
    renderAll();
  });
});

// Close modals
document.querySelectorAll(".close-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const modal = $(btn.dataset.close);
    if (modal) closeModal(modal);
  });
});

// Click outside modal
document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

// Filters
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.financeFilter = btn.dataset.filter;
    renderOperations();
  });
});

// Period filters
document.querySelectorAll(".period-btn").forEach(btn => {
  if (btn.dataset.period === state.periodFilter) {
    document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.periodFilter = btn.dataset.period;
    localStorage.setItem("ml_periodFilter", state.periodFilter);
    if (customPeriodBoxEl) {
      state.periodFilter === "custom"
        ? customPeriodBoxEl.classList.remove("hidden")
        : customPeriodBoxEl.classList.add("hidden");
    }
    if (state.periodFilter !== "custom") renderAll();
  });
});

// Custom period
const applyCustomPeriodBtn = $("applyCustomPeriodBtn");
if (applyCustomPeriodBtn) {
  applyCustomPeriodBtn.addEventListener("click", () => {
    state.customDateFrom = dateFromEl.value;
    state.customDateTo = dateToEl.value;
    renderAll();
  });
}

// Search
if (searchInputEl) searchInputEl.addEventListener("input", () => {
  state.searchQuery = searchInputEl.value;
  renderOperations();
});

if (categoryFilterEl) categoryFilterEl.addEventListener("change", () => {
  state.categoryFilter = categoryFilterEl.value;
  renderOperations();
});

// Open modals
const on = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };

on("openIncomeBtn", () => openFinanceModal("income"));
on("openExpenseBtn", () => openFinanceModal("expense"));
on("openIncomeBtn2", () => openFinanceModal("income"));
on("openExpenseBtn2", () => openFinanceModal("expense"));
on("openFoodBtn", () => openModal(foodModal));
on("foodAddBtn", () => openModal(foodModal));
on("openSportBtn", () => openModal(sportModal));
on("sportAddBtn", () => openModal(sportModal));
on("openRecurringBtn", () => openModal(recurringModal));
on("openGoalBtn", () => openModal(goalModal));
on("openPlannerBtn", () => openModal(plannerModal));
on("openHabitBtn", () => openModal(habitModal));
on("openFinanceFiltersBtn", () => openModal(financeFiltersModal));
on("openBudgetBtn", () => openModal(budgetModal));
on("openCategoryBudgetBtn", () => openModal(categoryBudgetModal));
on("openFinanceHistoryBtn", () => openModal(financeHistoryModal));

// Save buttons
on("saveFinanceBtn", saveFinance);
on("saveFoodBtn", saveFood);
on("saveSportBtn", saveSport);
on("saveMonthlyBudgetBtn", saveMonthlyBudget);
on("saveCategoryBudgetBtn", saveCategoryBudget);
on("saveRecurringBtn", saveRecurringPayment);
on("saveGoalBtn", saveGoal);
on("saveGoalDepositBtn", saveGoalDeposit);
on("savePlannerBtn", savePlannerTask);
on("saveHabitBtn", saveHabit);

// START
initApp();