local M = {}

local default_popup_opts = {
  position = "50%",
  size = {
    width = "60%",
    height = "60%"
  },
  enter = true,
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
    readonly = false,
  },
  win_options = {
    winblend = 10,
    winhighlight = "Normal:Normal,FloatBorder:FloatBorder",
  },
}

local callDenops = function(fn, arg)
  return vim.fn['denops#request']('redmine', fn, {arg})
end

M.read = function(issue_id)
  return callDenops('getIssue', {issueId = issue_id})
end

M.write = function(issue_id, contents, confirm_by_input)
  local bufnr = vim.fn.bufnr("%")

  local diff = callDenops('calcDiff', {
    issueId = issue_id,
    contents = contents,
  })
  if diff == "" then
    return
  end

  local opt = vim.g.redmine_popup_opts or default_popup_opts
  opt.enter = true
  opt.focusable = true
  opt.buf_options.filetype = "diff"
  opt.buf_options.modifiable = true

  local popup = require("nui.popup")(opt)
  local event = require("nui.utils.autocmd").event
  popup:mount()


  local reject = function()
    popup:unmount()
  end

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
  end

  local setup_popup = function(lines)
    popup:on(event.BufLeave, reject)
    popup:map("n", "Y", accept, {noremap = true})
    popup:map("n", "q", reject, { noremap = true })
    vim.api.nvim_buf_set_option(popup.bufnr, 'readonly', false)
    vim.api.nvim_buf_set_lines(popup.bufnr, 0, 1, false, lines)
    vim.api.nvim_buf_set_option(popup.bufnr, 'readonly', true)
    vim.cmd("b " .. popup.bufnr)
  end

  local diff_lines = vim.fn.split(diff .. '\n', '\n')

  if confirm_by_input then
    setup_popup(diff_lines)
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
  else
    local lines = { "# Enter `Y` for accept, `q` for reject", "" }
    vim.list_extend(lines, diff_lines)
    setup_popup(lines)
  end
end

return M
