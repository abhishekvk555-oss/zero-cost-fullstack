export const databaseSchema = [
  {
    table: 'employees',
    columns: [
      { name: 'id', type: 'INTEGER' },
      { name: 'name', type: 'TEXT' },
      { name: 'department', type: 'TEXT' },
      { name: 'salary', type: 'INTEGER' }
    ]
  }
];