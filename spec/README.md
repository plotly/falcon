## API Spec

### Normal Behaviour
#### /v1/authenticate
```javascript
{
  "error": null
}
```

#### /v1/databases
```javascript
{
  "databases": [
    "information_schema",
    "mysql",
    "performance_schema",
    "sys",
    "testdb"
  ],
  "error": null,
  "tables": null
}
```

#### /v1/selectdatabase?database=test
```javascript
{
  "error": null
}
```

#### /v1/tables
```javascript
{
  "error": null,
  "tables": [
    {
      "consumercomplaints": {}
    },
    {
      "test": {}
    }
  ]
}
```

#### /v1/preview?tables=test
```javascript
{
  "error": null,
  "previews": [
    {
      "test": {
        "columnnames": [
          "firstColumn",
          "secondColumn",
          "thirdColumn"
        ],
        "ncols": 3,
        "nrows": 5,
        "rows": [
          [
            1,
            1,
            "one"
          ],
          [
            2,
            2,
            "two"
          ],
          [
            3,
            3,
            "three"
          ],
          [
            4,
            4,
            "four"
          ],
          [
            5,
            5,
            "five"
          ]
        ]
      }
    }
  ]
}
```

#### /v1/query?statement=SELECT firstColumn, thirdColumn FROM test
```javascript
{
  "columnnames": [
    "firstColumn",
    "thirdColumn"
  ],
  "ncols": 2,
  "nrows": 3,
  "rows": [
    [
      1,
      "one"
    ],
    [
      2,
      "two"
    ],
    [
      3,
      "three"
    ]
  ],
  "error": null
}
```

#### /v1/disconnect
```javascript
{
  "error": null
}
```

### In case of errors
#### Plotly Database Connector is not connected
```javascript
{
  "error": {
    "name": "ConnectionError",
    "mesage": "Authentication failed. Make sure you are connected Error: ConnectionManager.getConnection was called after the connection manager was closed!",
    "timestamp": "10:59:27 GMT-0400 (EDT)"
  }
}
```

#### SQL syntax error in the query
```javascript
{
  "error": {
    "name": "SequelizeDatabaseError",
    "message": "ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near ''SELECT * FROM blah'' at line 1",
    "parent": {
      "code": "ER_PARSE_ERROR",
      "errno": 1064,
      "sqlState": "42000",
      "index": 0,
      "sql": "'SELECT * FROM blah'"
    },
    "original": {
      "code": "ER_PARSE_ERROR",
      "errno": 1064,
      "sqlState": "42000",
      "index": 0,
      "sql": "'SELECT * FROM blah'"
    },
    "sql": "'SELECT * FROM blah'",
    "timestamp": "10:55:47 GMT-0400 (EDT)"
  }
}
```
