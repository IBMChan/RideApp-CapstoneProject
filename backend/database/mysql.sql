-- MYSQL --
-- Table users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female', 'other'),
    role ENUM('driver', 'rider', 'admin') NOT NULL,

    license VARCHAR(100) NULL, 
    kyc_type ENUM('pan', 'aadhaar') NULL,
    kyc_number VARCHAR(255) NULL,
    is_live_currently ENUM('offline', 'online') NULL,

    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Drivers must have a license
    CONSTRAINT chk_license_driver CHECK (
        (role <> 'driver') OR (license IS NOT NULL)
    ),

    -- License format (example: MH1220241234567)
    CONSTRAINT chk_license_format CHECK (
        license IS NULL OR license REGEXP '^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$'
    ),

    -- KYC mandatory for drivers, optional (NULL) for others
    CONSTRAINT chk_kyc_driver CHECK (
        (role = 'driver' AND kyc_type IS NOT NULL AND kyc_number IS NOT NULL)
        OR (role <> 'driver' AND kyc_type IS NULL AND kyc_number IS NULL)
    ),

    -- Aadhaar format check (12 digits)
    CONSTRAINT chk_aadhar_format CHECK (
        kyc_type <> 'aadhaar' OR kyc_number REGEXP '^[0-9]{12}$'
    ),

    -- PAN format check (10 alphanumeric)
    CONSTRAINT chk_pan_format CHECK (
        kyc_type <> 'pan' OR kyc_number REGEXP '^[A-Za-z0-9]{10}$'
    ),

    -- Live status only for drivers
    CONSTRAINT chk_live_driver CHECK (
        (role = 'driver' AND is_live_currently IS NOT NULL)
        OR (role <> 'driver' AND is_live_currently IS NULL)
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
