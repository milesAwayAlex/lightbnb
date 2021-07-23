/* eslint-disable camelcase */
require('dotenv').config();

const { Pool } = require('pg');
// const properties = require('./json/properties.json');
// const users = require('./json/users.json');

const env = Object.fromEntries(
  Object.entries(process.env)
    .filter(([key]) => key.includes('POSTG'))
    .map(([key, val]) => [key.slice(6).toLowerCase(), val]),
);

const pool = new Pool({ ...env });

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = (email) =>
  pool
    .query(
      'SELECT id, name, email, PASSWORD FROM users WHERE email = $1::varchar',
      [email],
    )
    .then((res) => res.rows[0])
    .catch((e) => e.message);
// let user;
// for (const userId in users) {
//   user = users[userId];
//   if (user.email.toLowerCase() === email.toLowerCase()) {
//     break;
//   } else {
//     user = null;
//   }
// }
// return Promise.resolve(user);
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = (id) =>
  pool
    .query('SELECT id, name, email, PASSWORD FROM users WHERE id = $1', [id])
    .then((res) => res.rows[0])
    .catch((e) => e.message);
// return Promise.resolve(users[id]);
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = (user) =>
  pool
    .query(
      'INSERT INTO users (name, email, password) VALUES ($1::varchar, $2::varchar, $3::varchar) RETURNING *',
      [user.name, user.email, user.password],
    )
    .then((res) => res.rows[0])
    .catch((e) => e.message);
// const userId = Object.keys(users).length + 1;
// user.id = userId;
// users[userId] = user;
// return Promise.resolve(user);
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = (guest_id, limit = 10) =>
  pool
    .query(
      `SELECT reservations.*,
properties.*,
avg(property_reviews.rating)
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE reservations.guest_id = $1::integer
AND reservations.end_date < NOW()::date
GROUP BY properties.id,
reservations.id
ORDER BY reservations.start_date
LIMIT $2;`,
      [guest_id, limit],
    )
    .then((res) => res.rows)
    .catch((e) => e.message);
// return getAllProperties(null, 2);
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const {
    city,
    owner_id,
    minimum_price_per_night,
    maximum_price_per_night,
    minimum_rating,
  } = options;
  const queryParams = [];
  let queryStr = `
SELECT properties.*, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
`;
  if (city) {
    queryParams.push(`%${city}%`);
    queryStr += `WHERE city LIKE $${queryParams.length} `;
  }
  if (owner_id) {
    queryStr += queryParams.length ? 'AND ' : 'WHERE ';
    // if (queryParams.length) queryStr += 'AND ';
    queryParams.push(owner_id);
    queryStr += `properties.owner_id = $${queryParams.length}::integer `;
  }
  if (minimum_price_per_night) {
    queryStr += queryParams.length ? 'AND ' : 'WHERE ';
    // if (queryParams.length) queryStr += 'AND ';
    queryParams.push(minimum_price_per_night * 100);
    queryStr += `properties.cost_per_night >= $${queryParams.length}::integer `;
  }
  if (maximum_price_per_night) {
    queryStr += queryParams.length ? 'AND ' : 'WHERE ';
    // if (queryParams.length) queryStr += 'AND ';
    queryParams.push(maximum_price_per_night * 100);
    queryStr += `properties.cost_per_night <= $${queryParams.length}::integer `;
  }
  queryStr += 'GROUP BY properties.id ';
  if (minimum_rating) {
    queryParams.push(minimum_rating);
    queryStr += `HAVING avg(property_reviews.rating) >= $${queryParams.length}::real `;
  }
  queryParams.push(limit);
  queryStr += `ORDER BY cost_per_night LIMIT $${queryParams.length}`;
  return pool
    .query(queryStr, queryParams)
    .then((res) => res.rows)
    .catch((e) => e.message);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = (property) => {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
  } = property;
  const params = [
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night * 100,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
  ];
  return pool
    .query(
      `INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  ) VALUES (
  $1::integer,
  $2::varchar,
  $3::text,
  $4::varchar,
  $5::varchar,
  $6::integer,
  $7::varchar,
  $8::varchar,
  $9::varchar,
  $10::varchar,
  $11::varchar,
  $12::integer,
  $13::integer,
  $14::integer
  ) RETURNING *`,
      params,
    )
    .then((res) => res.rows[0])
    .catch((e) => e.message);
};
// const propertyId = Object.keys(properties).length + 1;
// property.id = propertyId;
// properties[propertyId] = property;
// return Promise.resolve(property);
exports.addProperty = addProperty;
