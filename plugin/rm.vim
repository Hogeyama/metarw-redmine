function! s:get_issue_id()
  let bufnr = bufnr("%")
  let line = join(getbufline(bufnr, 1), "\n")
  let issue_id = substitute(line, 'id: \(\d\+\)$', {m -> m[1]}, "")
  if issue_id is line
    throw issue_id
  else
    return issue_id
  endif
endfunction


function! s:read(...)
  let Read = luaeval("require'redmine'.read")
  if a:0 > 0
    let issue_id = a:1
  else
    let issue_id = s:get_issue_id()
  endif
  let contents = split(Read(issue_id), "\n")
  let bufnr = bufnr("%")
  call setbufline(bufnr, 1, contents)
  call deletebufline(bufnr, len(contents) + 1, '$')
endfunction
command! -nargs=? RmRead call s:read(<f-args>)

function! s:write()
  let Write = luaeval("require'redmine'.write",)
  let issue_id = s:get_issue_id()
  let contents = join(getline(1, '$'), "\n")
  let confirm_by_input = v:false
  call Write(issue_id, contents, confirm_by_input)
endfunction
command! -nargs=0 RmWrite call s:write(<f-args>)
