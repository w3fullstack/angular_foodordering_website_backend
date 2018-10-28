var tables = {
    users: "CREATE TABLE `users` (`id` INT(11) NOT NULL AUTO_INCREMENT,   \
        `username` varchar(255) NOT NULL,       \
        `first_name` varchar(255) NOT NULL,     \
        `last_name` varchar(255) NOT NULL,      \
        `email` varchar(255) NOT NULL,          \
        `password` varchar(255) NOT NULL,       \
        `location` varchar(255) NOT NULL,       \
        `role` int(11) NOT NULL,                \
        PRIMARY KEY (`id`)                      \
      )",
    category: "CREATE TABLE `category` (        \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `name` varchar(255) NOT NULL,           \
        PRIMARY KEY (`id`)                      \
      )",
    items: "CREATE TABLE `items` (              \
        `id` int(11) NOT NULL AUTO_INCREMENT,   \
        `category_id` int(11) NOT NULL,         \
        `name` varchar(255) NOT NULL,           \
        `description` varchar(255) NOT NULL,    \
        `price` float NOT NULL,                 \
        `tax` float NOT NULL                    \
        PRIMARY KEY (`id`)                      \
        FOREIGN KEY (`category_id`) REFERENCES category(`id`) \
      )"
};

module.exports = tables;