SELECT city,
  COUNT(reservations.id) AS total_res
FROM properties
  JOIN reservations ON properties.id = property_id
GROUP BY properties.city
ORDER BY total_res DESC;