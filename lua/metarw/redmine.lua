
local M = {}
require("plenary.async").tests.add_to_env()
local Semaphore = a.control.Semaphore

local popup_opts = {
  position = "50%",
  size = {
    width = "60%",
    height = "60%"
  },
  enter = false,
  focusable = true,
  zindex = 10,
  relative = "editor",
  border = {
    padding = {
      left = 1,
      right = 1,
    },
    style = "rounded",
  },
  buf_options = {
    filetype = "diff",
    modifiable = true,
    readonly = true,
  },
  win_options = {
    winblend = 10,
    winhighlight = "Normal:Normal,FloatBorder:FloatBorder",
  },
}

local callDenops = function(fn, arg)
  return vim.fn['denops#request']('redmine', fn, {arg})
end

M.read = function(fakepath)
  local issue_id = vim.fn['fnamemodify'](fakepath, ':t:r')
  return callDenops('getIssue', {issueId = issue_id})
end

M.write = function(fakepath, line1, line2, append_p)
  local bufnr = vim.fn.bufnr("%")
  local issue_id = vim.fn.fnamemodify(fakepath, ':t:r')
  local contents = table.concat(vim.fn.getline(line1, line2), '\n')

  -- TODO show diff and ask for confirmation
  local diff = callDenops('calcDiff', {
    issueId = issue_id,
    contents = contents,
  })
  if diff == "" then
    return
  end

  -- plenary の Semaphore とかを使いたかったが、main thread で wait しようとするとエラーになってしまった。
  -- 一旦諦めて、callback で put する。
  local popup = require("nui.popup")(popup_opts)
  local event = require("nui.utils.autocmd").event
  popup:mount()
  local reject = function()
    popup:unmount()
  end
  local accepted = false
  local accept = function()
    callDenops('putIssue', {
      issueId = issue_id,
      contents = contents,
    })
    local updated = callDenops('getIssue', {
      issueId = issue_id,
    })
    local lines = vim.fn.split(updated, '\n')
    vim.fn.setbufline(bufnr, 1, lines)
    vim.fn.deletebufline(bufnr, #lines + 1, '$')
    popup:unmount()
    accepted = true
  end
  popup:on(event.BufLeave, reject)
  popup:map("n", "q", reject, { noremap = true })
  local diff_lines = vim.fn.split(diff .. '\n', '\n')
  vim.api.nvim_buf_set_lines(popup.bufnr, 0, 1, false, diff_lines)
  vim.api.nvim_buf_set_option(popup.bufnr, 'filetype', 'diff')
  vim.cmd("b " .. popup.bufnr)
  vim.ui.input(
    {
      prompt = '`Y` for accept, `p` for pending, other keys for reject',
    },
    function(input)
      if input == "Y" then
        accept()
      else
        if input == "p" then
          return
        else
          reject()
        end
      end
    end
  )
end

return M
