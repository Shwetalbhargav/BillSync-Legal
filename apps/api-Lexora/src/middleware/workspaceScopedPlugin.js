import { getCurrentWorkspaceId, sanitizeOwnershipFields, workspaceObjectId } from './workspaceContext.js';

const QUERY_HOOKS = [
  'count',
  'countDocuments',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndReplace',
  'findOneAndUpdate',
  'replaceOne',
  'updateMany',
  'updateOne',
];

function hasWorkspacePredicate(filter = {}) {
  return Object.prototype.hasOwnProperty.call(filter, 'workspaceId');
}

function addWorkspaceToFilter(query) {
  const workspaceId = workspaceObjectId();
  if (!workspaceId) return;

  const filter = query.getFilter?.() || {};
  if (hasWorkspacePredicate(filter)) return;
  if (Object.keys(filter).length && (filter.$or || filter.$and)) {
    query.setQuery({ $and: [{ workspaceId }, filter] });
    return;
  }
  query.where({ workspaceId });
}

function patchUpdate(update) {
  const workspaceId = workspaceObjectId();
  if (!update || typeof update !== 'object') return;

  sanitizeOwnershipFields(update);
  if (!workspaceId) return;

  if (!Object.keys(update).some((key) => key.startsWith('$'))) {
    update.workspaceId = workspaceId;
    return;
  }

  update.$setOnInsert = {
    ...(update.$setOnInsert || {}),
    workspaceId,
  };
  if (update.$set) delete update.$set.workspaceId;
}

export function workspaceScopedPlugin(schema, options = {}) {
  if (options.workspaceScoped === false || schema.path('workspaceId')) return;

  schema.add({
    workspaceId: {
      type: schema.base.Schema.Types.ObjectId,
      ref: 'Firm',
      required: true,
      index: true,
    },
  });

  schema.index({ workspaceId: 1, createdAt: -1 });

  schema.pre('validate', function workspaceValidate(next) {
    if (!this.workspaceId) {
      const workspaceId = workspaceObjectId()
        || this.firmId
        || (process.env.NODE_ENV === 'production' ? null : this._id);
      if (workspaceId) this.workspaceId = workspaceId;
    }
    if (this.firmId && !this.workspaceId) this.workspaceId = this.firmId;
    next();
  });

  schema.pre('save', function workspaceSave(next) {
    const workspaceId = workspaceObjectId() || this.workspaceId || this.firmId;
    if (workspaceId) {
      this.workspaceId = workspaceId;
      if (schema.path('firmId') && !this.firmId) this.firmId = workspaceId;
    }
    next();
  });

  for (const hook of QUERY_HOOKS) {
    schema.pre(hook, function workspaceQuery(next) {
      addWorkspaceToFilter(this);
      patchUpdate(this.getUpdate?.());
      next();
    });
  }

  schema.pre('aggregate', function workspaceAggregate(next) {
    const workspaceId = workspaceObjectId();
    if (!workspaceId) return next();

    const pipeline = this.pipeline();
    const first = pipeline[0] || {};
    const match = first.$match;
    if (!match || !Object.prototype.hasOwnProperty.call(match, 'workspaceId')) {
      pipeline.unshift({ $match: { workspaceId } });
    }
    next();
  });
}
