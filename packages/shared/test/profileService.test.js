import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createContribution,
  deleteContribution,
  updateContribution,
  getContributionStatusLabel,
  moderateContribution,
  validateContribution,
} from '../src/profileService.js';

function clientWith({
  user = { id: 'user-1', app_metadata: { role: 'user' } },
  existingWord = null,
  pendingItems = [],
  contribution = { id: 'contribution-1', status: 'pending' },
  rpcError = null,
  deleted = true,
} = {}) {
  const calls = [];
  return {
    calls,
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      if (table === 'Words') {
        return { select: () => ({ ilike: () => ({ limit: () => ({ maybeSingle: async () => ({ data: existingWord, error: null }) }) }) }) };
      }
      return {
        select: () => {
          const filters = [];
          const query = {
            eq(field, value) { filters.push([field, value]); return query; },
            async maybeSingle() {
              if (filters.some(([field, value]) => field === 'id' && value === contribution.id)) {
                return { data: contribution, error: null };
              }
              return { data: null, error: null };
            },
            async then(resolve, reject) { return Promise.resolve({ data: pendingItems, error: null }).then(resolve, reject); },
          };
          return query;
        },
        delete: () => {
          const query = {
            eq() { return query; },
            select: () => ({ maybeSingle: async () => ({ data: deleted ? { id: contribution.id } : null, error: null }) }),
          };
          return query;
        },
      };
    },
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: name === 'approve_contribution' ? 'word-1' : contribution, error: rpcError };
    },
  };
}

test('normalizes whitespace and validates required values and field limits', () => {
  const { normalized, errors } = validateContribution({
    word_st: '  take\t off ', word_vi: '  rời đi ', pos: ' verb  ', meaning: '  leave\n quickly ', phonetic: ' /teɪk/ ', example: '  Take off quickly. ',
  });
  assert.deepEqual(errors, {});
  assert.deepEqual(normalized, { word_st: 'take off', word_vi: 'rời đi', pos: 'verb', meaning: 'leave quickly', phonetic: '/teɪk/', example: 'Take off quickly.' });
  assert.deepEqual(Object.keys(validateContribution({ word_st: ' ', word_vi: '', meaning: '' }).errors).sort(), ['meaning', 'word_st', 'word_vi']);
  assert.deepEqual(Object.keys(validateContribution({
    word_st: 'w'.repeat(101), word_vi: 'v'.repeat(101), meaning: 'd'.repeat(1001), pos: 'p'.repeat(51), phonetic: 'f'.repeat(101), example: 'e'.repeat(1001),
  }).errors).sort(), ['example', 'meaning', 'phonetic', 'pos', 'word_st', 'word_vi']);
});

test('requires a signed-in user before contribution work', async () => {
  await assert.rejects(createContribution(clientWith({ user: null }), { word_st: 'hello', word_vi: 'xin chào', meaning: 'xin chào' }), /đăng nhập/i);
});

test('rejects a contribution when its word already exists', async () => {
  await assert.rejects(createContribution(clientWith({ existingWord: { id: 'word-1' } }), { word_st: 'hello', word_vi: 'xin chào', meaning: 'xin chào' }), /đã có trong từ điển/i);
});

test('rejects a duplicate pending contribution from the same user', async () => {
  await assert.rejects(createContribution(clientWith({ pendingItems: [{ word_st: 'HELLO', word_vi: 'xin chào', meaning: 'xin chào' }] }), { word_st: ' hello ', word_vi: 'xin chào', meaning: 'xin   chào' }), /tương tự/i);
});

test('submits normalized values through the database RPC', async () => {
  const client = clientWith();
  await createContribution(client, { word_st: ' hello  world ', word_vi: ' xin chào ', meaning: ' a   greeting ' });
  assert.deepEqual(client.calls[0], {
    name: 'submit_contribution',
    args: { contribution_data: { word_st: 'hello world', word_vi: 'xin chào', pos: '', meaning: 'a greeting', example: '', phonetic: '' } },
  });
});

test('requires a rejection reason and sends approval or rejection to admin RPCs', async () => {
  const client = clientWith({ user: { id: 'admin-1', app_metadata: { role: 'admin' } } });
  await assert.rejects(moderateContribution(client, 'reject', 'contribution-1', '  '), /lý do từ chối/i);
  assert.equal(client.calls.length, 0);
  assert.equal(await moderateContribution(client, 'approve', 'contribution-1'), 'word-1');
  await moderateContribution(client, 'reject', 'contribution-2', ' Thiếu nguồn ');
  assert.deepEqual(client.calls, [
    { name: 'approve_contribution', args: { contribution_id: 'contribution-1' } },
    { name: 'reject_contribution', args: { contribution_id: 'contribution-2', note: 'Thiếu nguồn' } },
  ]);
  assert.equal(getContributionStatusLabel('approved'), 'Đã duyệt');
});

test('surfaces authorization and already-processed failures from moderation RPC', async () => {
  const admin = { id: 'admin-1', app_metadata: { role: 'admin' } };
  await assert.rejects(moderateContribution(clientWith({ user: admin, rpcError: new Error('permission denied') }), 'approve', 'contribution-1'), /permission denied/);
  await assert.rejects(moderateContribution(clientWith({ user: admin, rpcError: new Error('already processed') }), 'reject', 'contribution-1', 'Lý do'), /already processed/);
});

test('does not let an ordinary user call moderation RPCs', async () => {
  const client = clientWith({ user: { id: 'user-1', app_metadata: { role: 'user' } } });
  await assert.rejects(moderateContribution(client, 'approve', 'contribution-1'), /không có quyền/i);
  assert.equal(client.calls.length, 0);
});

test('lets an admin save a complete pending contribution draft', async () => {
  const client = clientWith({ user: { id: 'admin-1', app_metadata: { role: 'admin' } } });
  await updateContribution(client, 'contribution-1', {
    word_st: ' hello ', word_vi: ' xin chào ', pos: ' noun ', meaning: ' a greeting ', phonetic: '', example: ' Hello there. ',
  });
  assert.deepEqual(client.calls[0], {
    name: 'update_contribution',
    args: {
      contribution_id: 'contribution-1',
      contribution_data: { word_st: 'hello', word_vi: 'xin chào', pos: 'noun', meaning: 'a greeting', example: 'Hello there.', phonetic: '' },
    },
  });
});

test('deletes only a pending contribution and handles a concurrent moderation', async () => {
  const client = clientWith({ contribution: { id: 'contribution-1', status: 'pending' } });
  await deleteContribution(client, 'contribution-1');
  await assert.rejects(deleteContribution(clientWith({ contribution: { id: 'contribution-1', status: 'approved' } }), 'contribution-1'), /chờ duyệt/i);
  await assert.rejects(deleteContribution(clientWith({ contribution: { id: 'contribution-1', status: 'pending' }, deleted: false }), 'contribution-1'), /đã được xử lý/i);
});
