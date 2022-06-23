function! s:get_issue_id(fakepath)
  return fnamemodify(a:fakepath, ':t:r')
endfunction

function! metarw#rm#read(fakepath)
  let Read = luaeval("require'redmine'.read")
  let issue_id = s:get_issue_id(a:fakepath)
  return ["read", { -> Read(issue_id) }]
endfunction

function! metarw#rm#write(fakepath, line1, line2, append_p)
  let Write = luaeval("require'redmine'.write",)
  let issue_id = s:get_issue_id(a:fakepath)
  let contents = join(getline(a:line1, a:line2), "\n")
  let confirm_by_input = v:true
  call Write(issue_id, contents, confirm_by_input)
  return ["done"]
endfunction
