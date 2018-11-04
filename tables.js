var tables = {
  users: {
    name: 'users',
    query: "CREATE TABLE `users` (              \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `username` varchar(255) NOT NULL,       \
        `first_name` varchar(255) NOT NULL,     \
        `last_name` varchar(255) NOT NULL,      \
        `password` varchar(255) NOT NULL,       \
        `role` int(11) NOT NULL,                \
        `restaurant_id` int(11) NOT NULL,       \
        `created_at` int(11) NOT NULL,          \
        PRIMARY KEY (`id`)                      \
    )" },
  /**
   ** User Role (0: Client, 1: Manager, 2: Front Desk)
    */
  restaurant: {
    name: 'restaurant',
    query: "CREATE TABLE `restaurant` (           \
        `id` int(11) NOT NULL AUTO_INCREMENT,     \
        `name` varchar(255) NOT NULL,             \
        `photo` varchar(255) NOT NULL,            \
        `status` tinyint(1) NOT NULL DEFAULT '0', \
        `prepare_time` int(11) NOT NULL,          \
        `booking_fee` int(11) NOT NULL,           \
        `bank_account` TEXT NOT NULL,             \
        `created_at` int(11) NOT NULL,            \
        PRIMARY KEY (`id`)                        \
  )" },
  menu: {
    name: 'menu',
    query: "CREATE TABLE `menu` (               \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `restaurant_id` int(11) NOT NULL,       \
        `name` varchar(255) NOT NULL,           \
        `photo` varchar(255) NOT NULL,      \
        `created_at` int(11) NOT NULL,          \
        PRIMARY KEY (`id`)                      \
    )" },
  category: {
    name: 'category',
    query: "CREATE TABLE `category` (           \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `menu_id` int(11) NOT NULL,             \
        `name` varchar(255) NOT NULL,           \
        `photo` varchar(255) NOT NULL,      \
        `is_deleted` 	tinyint(1) NOT NULL,      \
        `created_at` int(11) NOT NULL,          \
        PRIMARY KEY (`id`)                      \
    )" },
  items: {
    name: 'items',
    query: "CREATE TABLE `items` (              \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `category_id` int(11) NOT NULL,         \
        `name` varchar(255) NOT NULL,           \
        `photo` varchar(255) NOT NULL,      \
        `description` varchar(255) NOT NULL,    \
        `price` float NOT NULL,                 \
        `tax` float NOT NULL,                   \
        `is_deleted` 	tinyint(1) NOT NULL,      \
        `created_at` int(11) NOT NULL,          \
        PRIMARY KEY (`id`)                      \
    )" },
  order: {
    name: 'order',
    query: "CREATE TABLE `order` (                  \
        `id` int(11) NOT NULL AUTO_INCREMENT,       \
        `customer_id` int(11) NOT NULL,             \
        `customer_name` varchar(255) NOT NULL,      \
        `customer_token` varchar(255) NOT NULL,     \
        `status` tinyint(1) NOT NULL DEFAULT '0',   \
        `created_at` int(11) NOT NULL,              \
        `ready_at` int(11) NOT NULL DEFAULT '0',    \
        `prepare_time` int(11) NOT NULL DEFAULT '0',\
        `completed_at` int(11) NOT NULL DEFAULT '0',\
        PRIMARY KEY (`id`)                          \
    )"},
  /**
   ** Order Status (0: Pending, 1: Ready to Pickup (Pending), 2: Completed, 3: Refunded)
    */
  ordered_items: {
    name: 'ordered_items',
    query: "CREATE TABLE `ordered_items` (    \
          `id` int(11) NOT NULL AUTO_INCREMENT,         \
          `order_id` int(11) NOT NULL,                  \
          `item_id` int(11) NOT NULL,                   \
          `amounts`  int(11) NOT NULL,                  \
          PRIMARY KEY (`id`)                            \
    )" },
  customer: {
    name: 'customer',
    query: "CREATE TABLE `customer` (                 \
          `id` int(11) NOT NULL AUTO_INCREMENT,       \
          `user_id` int(11) NOT NULL,                 \
          `name` varchar(255) NOT NULL,               \
          `email` varchar(255) NOT NULL,              \
          `phone` varchar(255) NOT NULL,              \
          `tokens` TEXT NOT NULL,                     \
          `created_at` int(11) NOT NULL DEFAULT '0',  \
          PRIMARY KEY (`id`)                          \
    )" },
  cart: {
    name: 'cart',
    query: "CREATE TABLE `cart` (               \
          `id` int(11) NOT NULL AUTO_INCREMENT, \
          `user_id` int(11) NOT NULL,           \
          `items` TEXT NOT NULL,                \
          `past_orders` TEXT NOT NULL,          \
          PRIMARY KEY (`id`)                    \
    )" },
  transaction: {
    name: 'transaction',
    query: "CREATE TABLE `transaction` (          \
          `order_id` int(11) NOT NULL,            \
          `transaction_id` varchar(255) NOT NULL  \
    )" },
  files: {
    name: 'files',
    query: "CREATE TABLE `files` (              \
      `id` int(11) NOT NULL AUTO_INCREMENT,     \
      `file_id` varchar(255) NOT NULL,          \
      `path` varchar(255) NOT NULL,             \
      PRIMARY KEY(`id`)                         \
    )" },
};

module.exports = tables;