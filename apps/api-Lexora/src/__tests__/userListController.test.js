import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  countDocuments: vi.fn(),
  find: vi.fn(),
  limit: vi.fn(),
  skip: vi.fn(),
  sort: vi.fn(),
}));

vi.mock('../modules/users/models/User.js', () => ({
  default: {
    countDocuments: mocks.countDocuments,
    find: mocks.find,
  },
}));

const { listUsers } = await import('../modules/users/controllers/userController.js');

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function mockUserQuery(items = []) {
  mocks.sort.mockReturnValue({ skip: mocks.skip });
  mocks.skip.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockResolvedValue(items);
  mocks.find.mockReturnValue({ sort: mocks.sort });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserQuery([]);
  mocks.countDocuments.mockResolvedValue(0);
});

describe('listUsers controller', () => {
  test('normalizes blank smoke-test query params to defaults', async () => {
    const req = {
      query: {
        firmId: '',
        limit: '',
        page: '',
        q: '',
        role: '',
        sort: '',
      },
    };
    const res = mockResponse();

    await listUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, page: 1, limit: 20, total: 0 });
    expect(mocks.find).toHaveBeenCalledWith({}, { passwordHash: 0 });
    expect(mocks.sort).toHaveBeenCalledWith('name');
    expect(mocks.skip).toHaveBeenCalledWith(0);
    expect(mocks.limit).toHaveBeenCalledWith(20);
  });

  test('rejects unsupported sort instead of raising a server error', async () => {
    const res = mockResponse();

    await listUsers({ query: { sort: '$where' } }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('sort is not supported');
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
