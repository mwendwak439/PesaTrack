
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function IncomeExpenseLineChart({ transactions }) {

  // Group transactions by date
  const groupedData = transactions.reduce((result, item) => {
    const date = item.date;

    let existingDate = result.find(
      (entry) => entry.date === date
    );

    if (!existingDate) {
      existingDate = {
        date: date,
        income: 0,
        expenses: 0
      };

      result.push(existingDate);
    }

    if (item.transaction_type === 'Income') {
      existingDate.income += Number(item.amount);
    } else if (item.transaction_type === 'Expense') {
      existingDate.expenses += Number(item.amount);
    }

    return result;
  }, []);

  // Sort dates from oldest to newest
  groupedData.sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div style={{ width: '100%', height: 350 }}>
      <h2>Income vs Expenses Over Time</h2>

      {groupedData.length === 0 ? (
        <p>No transaction data available yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={groupedData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis />

            <Tooltip
              formatter={(value) => `KES ${Number(value).toFixed(2)}`}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="income"
              stroke="#0088FE"
              name="Income"
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#FF8042"
              name="Expenses"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default IncomeExpenseLineChart;
