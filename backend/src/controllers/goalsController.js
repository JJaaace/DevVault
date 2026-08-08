const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')
const { listGoals, createGoal, updateGoal, deleteGoal, reorderGoals } = require('../services/goalService')

async function list(req, res) {
  try { return sendSuccess(res, await listGoals(req.auth.userId)) }
  catch (error) { return sendError(res, error, 'GOALS_LIST_FAILED', 'Unable to load goals.') }
}
async function create(req, res) {
  try { return sendCreated(res, await createGoal(req.auth.userId, req.body || {})) }
  catch (error) { return sendError(res, error, 'GOAL_CREATE_FAILED', 'Unable to create goal.') }
}
async function update(req, res) {
  try { return sendSuccess(res, await updateGoal(req.auth.userId, req.params.goalId, req.body || {})) }
  catch (error) { return sendError(res, error, 'GOAL_UPDATE_FAILED', 'Unable to update goal.') }
}
async function remove(req, res) {
  try { await deleteGoal(req.auth.userId, req.params.goalId); return sendNoContent(res) }
  catch (error) { return sendError(res, error, 'GOAL_DELETE_FAILED', 'Unable to delete goal.') }
}
async function reorder(req, res) {
  try { return sendSuccess(res, await reorderGoals(req.auth.userId, req.body?.orderedIds)) }
  catch (error) { return sendError(res, error, 'GOALS_REORDER_FAILED', 'Unable to reorder goals.') }
}

module.exports = { list, create, update, remove, reorder }
