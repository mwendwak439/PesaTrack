import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function ExpensePieChart({ transactions }) {

  // Get only expense transactions
  const expenses = transactions.filter(
    (item) => item.transaction_type === 'Expense'
  );

  // Group expenses by category
  const categoryData = expenses.reduce((result, item) => {
    const category = item.category;

    const existingCategory = result.find(
      (entry) => entry.name === category
    );

    if (existingCategory) {
      existingCategory.value += Number(item.amount);
    } else {
      result.push({
        name: category,
        value: Number(item.amount)
      });
    }

    return result;
  }, []);

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#e75480',
    '#82ca9d'
  ];

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h2>Expenses by Category</h2>

      {categoryData.length === 0 ? (
        <p>No expense data available yet.</p>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ExpensePieChart;