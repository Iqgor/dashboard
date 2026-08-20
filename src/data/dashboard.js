export const navItems = [
  { label: "Overview", active: true },
  { label: "Accounts" },
  { label: "Transactions" },
  { label: "Budget" },
  { label: "Goals" },
  { label: "Reports" },
];

export const kpis = [
  {
    label: "Net worth",
    value: "€42,840",
    delta: "+€1,240",
    detail: "vs last month",
    tone: "neutral",
  },
  {
    label: "Income",
    value: "€8,450",
    delta: "+€620",
    detail: "this month",
    tone: "positive",
  },
  {
    label: "Expenses",
    value: "€5,310",
    delta: "-€340",
    detail: "this month",
    tone: "negative",
  },
  {
    label: "Savings rate",
    value: "27%",
    delta: "+4.2%",
    detail: "target 30%",
    tone: "neutral",
  },
];

export const cashFlow = [
  { month: "Jan", income: 3, expense: 2.8 },
  { month: "Feb", income: 4.8, expense: 3.1 },
  { month: "Mar", income: 5.3, expense: 3.6 },
  { month: "Apr", income: 6.1, expense: 3.9 },
  { month: "May", income: 5.7, expense: 3.4 },
  { month: "Jun", income: 6.8, expense: 4.2 },
];

export const spending = [
  { name: "Housing", value: 32, amount: "€1,420", color: "#18181b" },
  { name: "Food", value: 18, amount: "€820", color: "#3f3f46" },
  { name: "Transport", value: 12, amount: "€540", color: "#52525b" },
  { name: "Lifestyle", value: 24, amount: "€1,090", color: "#a1a1aa" },
  { name: "Other", value: 14, amount: "€640", color: "#e4e4e7" },
];

export const transactions = [
  { name: "Salary deposit", category: "Income", date: "Today", amount: "+€3,200", type: "income" },
  { name: "Rent", category: "Housing", date: "18 Aug", amount: "-€1,240", type: "expense" },
  { name: "Groceries", category: "Food", date: "16 Aug", amount: "-€148", type: "expense" },
  { name: "Freelance invoice", category: "Income", date: "12 Aug", amount: "+€840", type: "income" },
  { name: "Streaming bundle", category: "Lifestyle", date: "09 Aug", amount: "-€24", type: "expense" },
  { name: "Train ticket", category: "Transport", date: "08 Aug", amount: "-€42", type: "expense" },
];

export const goals = [
  { name: "Emergency fund", saved: "€9,800", total: "€12,000", progress: 82 },
  { name: "Travel fund", saved: "€4,600", total: "€8,000", progress: 58 },
  { name: "New laptop", saved: "€1,250", total: "€2,400", progress: 52 },
];

export const bills = [
  { name: "Electricity", due: "25 Aug", amount: "€96" },
  { name: "Insurance", due: "27 Aug", amount: "€132" },
  { name: "Internet", due: "29 Aug", amount: "€49" },
];
