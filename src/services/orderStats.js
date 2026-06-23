export const isSubscriptionOrder = (order) =>
  (order?.paymentMethod || '').toLowerCase().includes('subscription')

export const getOrderAmount = (order) => Number(order?.billingTotal) || 0

export const computeDailyOrderStats = (orders = []) => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  let dailyMonthly = 0
  let dailyAllTime = 0

  orders
    .filter((order) => !isSubscriptionOrder(order))
    .forEach((order) => {
      const amount = getOrderAmount(order)
      dailyAllTime += amount
      const created = new Date(order.createdAt)
      if (created.getMonth() === currentMonth && created.getFullYear() === currentYear) {
        dailyMonthly += amount
      }
    })

  return { dailyMonthly, dailyAllTime }
}

export const formatOrderAmount = (amount) =>
  (Number(amount) || 0).toLocaleString()
