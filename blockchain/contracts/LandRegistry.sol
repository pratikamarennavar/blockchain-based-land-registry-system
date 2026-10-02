// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {

    // ============================================================
    // ADMIN
    // ============================================================

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    // ============================================================
    // USER
    // ============================================================

    struct User {
        address wallet;
        string name;
        string email;
        bool registered;
        bool verified;
    }

    mapping(address => User) public users;

    // ============================================================
    // LAND
    // ============================================================

    struct Land {
        uint256 landId;
        string ownerName;
        string location;
        string surveyNumber;
        uint256 area;
        string documentHash;
        address owner;
        bool registered;
        bool verified;
        bool saleRequested;
        address buyer;
        bool saleApproved;
    }

    mapping(uint256 => Land) public lands;

    uint256 public landCount;

    // ============================================================
    // EVENTS
    // ============================================================

    event UserRegistered(
        address indexed user,
        string name,
        string email
    );

    event UserVerified(
        address indexed user
    );

    event LandRegistered(
        uint256 indexed landId,
        address indexed owner
    );

    event LandVerified(
        uint256 indexed landId
    );

    event PurchaseRequested(
        uint256 indexed landId,
        address indexed buyer
    );

    event SaleApproved(
        uint256 indexed landId,
        address indexed seller,
        address indexed buyer
    );

    // ============================================================
    // USER REGISTRATION
    // ============================================================

    function registerUser(
        string memory _name,
        string memory _email
    ) public {

        require(
            !users[msg.sender].registered,
            "User already registered"
        );

        users[msg.sender] = User(
            msg.sender,
            _name,
            _email,
            true,
            false
        );

        emit UserRegistered(
            msg.sender,
            _name,
            _email
        );
    }

    // ============================================================
    // ADMIN VERIFIES USER
    // ============================================================

    function verifyUser(
        address _user
    ) public onlyAdmin {

        require(
            users[_user].registered,
            "User not registered"
        );

        users[_user].verified = true;

        emit UserVerified(_user);
    }

    // ============================================================
    // LAND REGISTRATION
    // ============================================================

    function registerLand(
        string memory _ownerName,
        string memory _location,
        string memory _surveyNumber,
        uint256 _area,
        string memory _documentHash
    ) public {

        require(
            users[msg.sender].registered,
            "User not registered"
        );

        require(
            users[msg.sender].verified,
            "Seller not verified"
        );

        require(
            _area > 0,
            "Area must be greater than zero"
        );

        landCount++;

        lands[landCount] = Land(
            landCount,
            _ownerName,
            _location,
            _surveyNumber,
            _area,
            _documentHash,
            msg.sender,
            true,
            false,
            false,
            address(0),
            false
        );

        emit LandRegistered(
            landCount,
            msg.sender
        );
    }

    // ============================================================
    // ADMIN VERIFIES LAND
    // ============================================================

    function verifyLand(
        uint256 _landId
    ) public onlyAdmin {

        require(
            lands[_landId].registered,
            "Land not registered"
        );

        require(
            !lands[_landId].verified,
            "Land already verified"
        );

        lands[_landId].verified = true;

        emit LandVerified(_landId);
    }

    // ============================================================
    // BUYER REQUESTS TO BUY LAND
    // ============================================================

    function requestToBuy(
        uint256 _landId
    ) public {

        require(
            lands[_landId].registered,
            "Land does not exist"
        );

        require(
            lands[_landId].verified,
            "Land not verified"
        );

        require(
            users[msg.sender].registered,
            "Buyer not registered"
        );

        require(
            users[msg.sender].verified,
            "Buyer not verified"
        );

        require(
            msg.sender != lands[_landId].owner,
            "Owner cannot buy own land"
        );

        require(
            !lands[_landId].saleRequested,
            "Sale request already exists"
        );

        require(
            !lands[_landId].saleApproved,
            "Land already sold"
        );

        lands[_landId].saleRequested = true;
        lands[_landId].buyer = msg.sender;

        emit PurchaseRequested(
            _landId,
            msg.sender
        );
    }

    // ============================================================
    // SELLER APPROVES SALE
    // ============================================================

    function approveSale(
        uint256 _landId
    ) public {

        require(
            lands[_landId].registered,
            "Land does not exist"
        );

        require(
            msg.sender == lands[_landId].owner,
            "Only land owner can approve"
        );

        require(
            lands[_landId].saleRequested,
            "No purchase request"
        );

        address previousOwner = lands[_landId].owner;
        address newOwner = lands[_landId].buyer;

        require(
            users[newOwner].verified,
            "Buyer is not verified"
        );

        lands[_landId].saleApproved = true;

        // Transfer ownership
        lands[_landId].owner = newOwner;

        // Update owner name
        lands[_landId].ownerName = users[newOwner].name;

        // Clear active request
        lands[_landId].saleRequested = false;

        emit SaleApproved(
            _landId,
            previousOwner,
            newOwner
        );
    }

    // ============================================================
    // GET LAND DETAILS
    // ============================================================

    function getLand(
        uint256 _landId
    )
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            string memory,
            address,
            bool,
            bool,
            bool,
            address,
            bool
        )
    {
        require(
            lands[_landId].registered,
            "Land does not exist"
        );

        Land memory land = lands[_landId];

        return (
            land.landId,
            land.ownerName,
            land.location,
            land.surveyNumber,
            land.area,
            land.documentHash,
            land.owner,
            land.registered,
            land.verified,
            land.saleRequested,
            land.buyer,
            land.saleApproved
        );
    }

    // ============================================================
    // GET USER DETAILS
    // ============================================================

    function getUser(
        address _user
    )
        public
        view
        returns (
            address,
            string memory,
            string memory,
            bool,
            bool
        )
    {
        require(
            users[_user].registered,
            "User not registered"
        );

        User memory user = users[_user];

        return (
            user.wallet,
            user.name,
            user.email,
            user.registered,
            user.verified
        );
    }
}