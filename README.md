# Lenos - Powder Coating Management System

Lenos is a comprehensive web application designed for managing powder-coating jobs end-to-end in small-to-medium coating shops. It provides tools for quoting, scheduling, production tracking, quality control, inventory management, invoicing, and reporting.

## Features

### Core Functionality
- **Customer Management**: Store and manage customer information
- **Job Quoting**: Create quotes for powder coating jobs
- **Scheduling**: Schedule jobs for production
- **Production Tracking**: Track job progress through different stages
- **Quality Control**: Record and manage quality inspection checks
- **Inventory Management**: Track consumables, powders, and equipment
- **Invoicing**: Generate and manage invoices for completed jobs
- **Dashboard Reporting**: View key metrics and statistics

### Job Lifecycle
1. **Quote**: Create initial job quote for customer
2. **Schedule**: Set production dates for approved jobs  
3. **Production**: Track job through in-progress status
4. **Quality Control**: Perform quality checks (visual, thickness, adhesion, etc.)
5. **Completion**: Mark jobs as complete
6. **Invoicing**: Generate invoices for completed work

### Quality Control Features
- Visual inspection tracking
- Coating thickness measurements
- Adhesion testing
- Color matching verification
- Finish quality assessment

### Inventory Management
- Track powder, chemicals, consumables, and equipment
- Monitor stock levels with reorder alerts
- Supplier information management
- Cost tracking per unit

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lenos
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (suitable for small-to-medium shops)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with responsive design

## Database Schema

The application uses SQLite with the following main tables:
- `customers` - Customer information
- `jobs` - Job details and status
- `inventory` - Stock items and materials
- `quality_checks` - Quality control records
- `invoices` - Invoice information
- `job_inventory_usage` - Material usage tracking

## Usage

### Getting Started
1. Start by adding customers in the Customers section
2. Create jobs and quotes in the Jobs section
3. Set up inventory items for tracking materials
4. Use the dashboard to monitor overall business metrics

### Workflow
1. **Add Customer**: Create customer records with contact information
2. **Create Job**: Generate job quotes with pricing and scheduling
3. **Track Progress**: Update job status as work progresses
4. **Quality Control**: Record quality checks during or after production
5. **Complete & Invoice**: Mark jobs complete and generate invoices

### Quality Control Process
- Perform various quality checks (visual, thickness, adhesion, color match, finish)
- Record pass/fail results with detailed notes
- Track who performed each inspection
- Maintain quality history for each job

## Configuration

The application runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Development

The application is designed to be simple and maintainable for small coating shops. All data is stored locally in SQLite, making it easy to backup and manage.

### File Structure
```
lenos/
├── server.js          # Main server application
├── package.json       # Dependencies and scripts
├── lenos.db          # SQLite database (created on first run)
└── public/
    ├── index.html    # Main application interface
    ├── app.js        # Frontend JavaScript
    └── styles.css    # Application styling
```

## Contributing

This is a focused application for powder coating businesses. When contributing:
1. Keep changes minimal and targeted
2. Maintain the simple, clean interface
3. Ensure compatibility with the existing SQLite database
4. Test all functionality before submitting changes

## License

ISC