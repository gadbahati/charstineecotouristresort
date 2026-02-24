-- Database Schema for Admin Items and Rentals

CREATE TABLE admin_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    rental_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME,
    FOREIGN KEY (item_id) REFERENCES admin_items(item_id)
);