-- MYSQL --
-- Table users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('driver', 'rider', 'admin') NOT NULL,
    license VARCHAR(100) UNIQUE, 
    kyc_type ENUM('pan', 'aadhar'),
    kyc_document VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female', 'other'),
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    is_live_currently ENUM('offline', 'online') DEFAULT 'offline',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_license_driver CHECK (
        (role <> 'driver') OR (license IS NOT NULL)
    ),
    CONSTRAINT chk_license_format CHECK (
        license IS NULL OR license REGEXP '^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$'
    ),
    CONSTRAINT chk_kyc_driver CHECK (
        (role <> 'driver') OR (kyc_type IS NOT NULL AND kyc_document IS NOT NULL)
    ),
    CONSTRAINT chk_aadhar_format CHECK (
        kyc_type <> 'aadhar' OR kyc_document REGEXP '^[0-9]{12}$'
    ),
    CONSTRAINT chk_pan_format CHECK (
        kyc_type <> 'pan' OR kyc_document REGEXP '^[A-Za-z0-9]{10}$'
    ),
    CONSTRAINT chk_live_driver CHECK (
        (role <> 'driver') OR (is_live_currently IS NULL)
    )
);



--Table vehicles--

CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    model VARCHAR(50),
    make VARCHAR(50),
    year INT,
    plate_no VARCHAR(20) NOT NULL UNIQUE,
    color VARCHAR(30),
    vehicle_status ENUM('active', 'inactive') DEFAULT 'inactive',
    seating INT,
    category ENUM('non_ac', 'ac', 'sedan', 'suv'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_seating CHECK (seating IN (4, 7)),
    CONSTRAINT chk_plate_no CHECK (
        plate_no REGEXP '^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$'
    ),
    CONSTRAINT fk_driver FOREIGN KEY (driver_id) REFERENCES users(user_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);

--rides--
CREATE TABLE rides (
    ride_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    rider_id INT,
    driver_id INT,
    pickup_loc VARCHAR(255) NOT NULL,
    drop_loc VARCHAR(255) NOT NULL,
    status ENUM('requested', 'accepted', 'in_progress', 'cancelled', 'completed', 'expired') DEFAULT 'requested',
    distance DECIMAL(6,2),
    fare DECIMAL(10,2),
    ride_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME,
    CONSTRAINT fk_ride_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_ride_rider FOREIGN KEY (rider_id) REFERENCES users(user_id),
    CONSTRAINT fk_ride_driver FOREIGN KEY (driver_id) REFERENCES users(user_id)
);
