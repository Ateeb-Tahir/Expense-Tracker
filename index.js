
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const date = document.getElementById('date');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const clearFilters = document.getElementById('clearFilters');
const toggleTheme = document.getElementById('toggleTheme');
const downloadCsv = document.getElementById('downloadCsv');
const currencySelect = document.getElementById('currency');  // NEW

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let expensePieChart = null;
let incomeExpenseBarChart = null;

let currencySymbol = currencySelect.value; // track selected currency symbol
// Auto-fill description when income and salary selected
function autoFillDescription() {
  if (type.value.toLowerCase() === 'income' && category.value.toLowerCase() === 'salary') {
    text.value = 'Salary';
  } else {
    text.value = '';  // or keep current value, your choice
  }
}

// Listen for changes on type and category to auto-fill
type.addEventListener('change', autoFillDescription);
category.addEventListener('change', autoFillDescription);

const todayStr = new Date().toISOString().split('T')[0];
date.setAttribute('max', todayStr);
filterFrom.setAttribute('max', todayStr);
filterTo.setAttribute('max', todayStr);

form.addEventListener('submit', addTransaction);
filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);
filterFrom.addEventListener('change', renderTransactions);
filterTo.addEventListener('change', renderTransactions);
clearFilters.addEventListener('click', clearAllFilters);
downloadCsv.addEventListener('click', exportToCSV);
toggleTheme.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});
currencySelect.addEventListener('change', () => {
  currencySymbol = currencySelect.value;
  renderTransactions();
});

function addTransaction(e) {
  e.preventDefault();
  if (text.value.trim() === '' || amount.value.trim() === '' || date.value.trim() === '') {
    alert('Please fill all fields');
    return;
  }
  const selectedDate = new Date(date.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    alert('Date cannot be in the future!');
    return;
  }
  const transaction = {
    id: Date.now(),
    text: text.value,
    amount: type.value === 'expense' ? -Math.abs(+amount.value) : Math.abs(+amount.value),
    category: category.value,
    date: date.value
  };
  transactions.push(transaction);
  updateLocalStorage();
  form.reset();
  renderTransactions();
}

function renderTransactions() {
  list.innerHTML = '';
  let filtered = transactions.filter(t => {
    if (filterType.value !== 'all') {
      if (filterType.value === 'income' && t.amount <= 0) return false;
      if (filterType.value === 'expense' && t.amount >= 0) return false;
    }
    if (filterCategory.value !== 'all' && t.category !== filterCategory.value) return false;
    if (filterFrom.value && t.date < filterFrom.value) return false;
    if (filterTo.value && t.date > filterTo.value) return false;
    return true;
  });

  if (filtered.length === 0) {
    const noDataMsg = document.createElement('li');
    noDataMsg.textContent = 'No transactions found';
    noDataMsg.style.textAlign = 'center';
    noDataMsg.style.color = '#888';
    list.appendChild(noDataMsg);
  } else {
    filtered.forEach(addTransactionDOM);
  }

  updateValues(filtered);
  updateCharts(filtered);
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const formattedAmount = Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const item = document.createElement('li');
  item.classList.add(transaction.amount < 0 ? 'expense' : 'income');
  item.innerHTML = `
    ${transaction.text} (${transaction.category}) - ${transaction.date}
    <span>${sign}${currencySymbol}${formattedAmount}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;
  list.appendChild(item);
}

function updateValues(filteredTransactions = transactions) {
  const amounts = filteredTransactions.map(t => t.amount);
  const total = amounts.reduce((acc, val) => acc + val, 0);
  const income = amounts.filter(v => v > 0).reduce((acc, val) => acc + val, 0);
  const expense = (amounts.filter(v => v < 0).reduce((acc, val) => acc + val, 0) * -1);

  balance.innerText = `${currencySymbol}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  money_plus.innerText = `+${currencySymbol}${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  money_minus.innerText = `-${currencySymbol}${expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  renderTransactions();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function exportToCSV() {
  let filtered = transactions.filter(t => {
    if (filterType.value !== 'all') {
      if (filterType.value === 'income' && t.amount <= 0) return false;
      if (filterType.value === 'expense' && t.amount >= 0) return false;
    }
    if (filterCategory.value !== 'all' && t.category !== filterCategory.value) return false;
    if (filterFrom.value && t.date < filterFrom.value) return false;
    if (filterTo.value && t.date > filterTo.value) return false;
    return true;
  });

  const headers = ['Description', 'Amount', 'Category', 'Date'];
  const rows = filtered.map(t => [t.text, t.amount, t.category, t.date]);
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'transactions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function clearAllFilters() {
  filterType.value = 'all';
  filterCategory.value = 'all';
  filterFrom.value = '';
  filterTo.value = '';
  renderTransactions();
}

function updateCharts(filteredTransactions) {
  updateExpensePieChart(filteredTransactions);
  updateIncomeExpenseBarChart(filteredTransactions);
}

function updateExpensePieChart(filteredTransactions) {
  const expenseByCategory = {};
  filteredTransactions.forEach(t => {
    if (t.amount < 0) {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Math.abs(t.amount);
    }
  });
  const categories = Object.keys(expenseByCategory);
  const amounts = Object.values(expenseByCategory);
  if (expensePieChart) expensePieChart.destroy();
  const ctxPie = document.getElementById('expensePieChart').getContext('2d');
  expensePieChart = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: categories.length ? categories : ['No Expenses'],
      datasets: [{
        label: 'Expenses by Category',
        data: amounts.length ? amounts : [1],
        backgroundColor: ['#e74c3c','#f39c12','#8e44ad','#3498db','#2ecc71','#d35400','#7f8c8d'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function updateIncomeExpenseBarChart(filteredTransactions) {
  const monthTotals = {};
  filteredTransactions.forEach(t => {
    const d = new Date(t.date);
    if (isNaN(d)) return;
    const month = d.toISOString().slice(0, 7);
    if (!monthTotals[month]) monthTotals[month] = { income: 0, expense: 0 };
    if (t.amount > 0) monthTotals[month].income += t.amount;
    else monthTotals[month].expense += Math.abs(t.amount);
  });
  const months = Object.keys(monthTotals).sort();
  const incomeData = months.map(m => +monthTotals[m].income.toFixed(2));
  const expenseData = months.map(m => +monthTotals[m].expense.toFixed(2));
  if (incomeExpenseBarChart) incomeExpenseBarChart.destroy();
  const ctxBar = document.getElementById('incomeExpenseBarChart').getContext('2d');
  incomeExpenseBarChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: months.length ? months : ['No Data'],
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: '#2ecc71' },
        { label: 'Expense', data: expenseData, backgroundColor: '#e74c3c' }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { 
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value.toLocaleString();
            }
          }
        }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
document.getElementById('filterFrom').addEventListener('change', applyFilters);
document.getElementById('filterTo').addEventListener('change', applyFilters);

function applyFilters() {
  const type = document.getElementById('filterType').value;
  const category = document.getElementById('filterCategory').value;
  const fromDate = document.getElementById('filterFrom').value;
  let toDate = document.getElementById('filterTo').value;

  // Default to today if end date not selected
  if (!toDate) {
    const today = new Date();
    toDate = today.toISOString().split('T')[0]; // format as YYYY-MM-DD
  }

  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  const filtered = transactions.filter(tx => {
    const txDate = tx.date; // assume date stored as 'YYYY-MM-DD'
    return (
      (type === 'all' || tx.type === type) &&
      (category === 'all' || tx.category === category) &&
      (!fromDate || txDate >= fromDate) &&
      (!toDate || txDate <= toDate)
    );
  });

  displayTransactions(filtered);
}
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("filterFrom").setAttribute("max", today);
  document.getElementById("filterTo").setAttribute("max", today);
});


window.removeTransaction = removeTransaction;
renderTransactions();