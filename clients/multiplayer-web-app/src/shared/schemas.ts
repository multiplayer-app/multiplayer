export const DIAGRAM_JSON_SCHEMA = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
            data: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                fields: {
                  type: 'array',
                  items: [
                    {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        name: {
                          type: 'string',
                        },
                        type: {
                          type: 'string',
                        },
                      },
                      required: ['id', 'name', 'type'],
                    },
                  ],
                },
              },
              required: ['name'],
            },
            position: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                },
                y: {
                  type: 'integer',
                },
              },
              required: ['x', 'y'],
            },
          },
          required: ['id', 'type', 'data', 'position'],
        },
      ],
    },
    edges: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            source: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
              },
              required: ['id'],
            },
            target: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
              },
              required: ['id'],
            },
          },
          required: ['id', 'source', 'target'],
        },
      ],
    },
  },
  required: ['nodes', 'edges'],
};
