SELECT properties.id,
  properties.owner_id,
  properties.title,
  properties.description,
  properties.thumbnail_photo_url,
  properties.cover_photo_url,
  properties.cost_per_night,
  properties.parking_spaces,
  properties.number_of_bathrooms,
  properties.number_of_bedrooms,
  properties.country,
  properties.street,
  properties.city,
  properties.province,
  properties.post_code,
  properties.active,
  avg(property_reviews.rating)
FROM properties
  JOIN property_reviews ON property_id = properties.id
WHERE city = 'Vancouver'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;