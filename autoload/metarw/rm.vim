function! metarw#rm#read(fakepath)
  let Read = luaeval("require'metarw.redmine'.read",)
  return ["read", { -> Read(a:fakepath) }]
endfunction

function! metarw#rm#write(fakepath, line1, line2, append_p)
  let Write = luaeval("require'metarw.redmine'.write",)
  call Write(a:fakepath, a:line1, a:line2, a:append_p)
  return ["done"]
endfunction
