0x140619e90: 88542410 mov byte ptr [rsp + 0x10], dl
0x140619e94: 55 push rbp
0x140619e95: 53 push rbx
0x140619e96: 57 push rdi
0x140619e97: 488bec mov rbp, rsp
0x140619e9a: 4883ec70 sub rsp, 0x70
0x140619e9e: 0fb6fa movzx edi, dl
0x140619ea1: 488bd9 mov rbx, rcx
0x140619ea4: 4584c0 test r8b, r8b
0x140619ea7: 743d je 0x140619ee6
0x140619ea9: 4c8b4908 mov r9, qword ptr [rcx + 8]
0x140619ead: 498b4108 mov rax, qword ptr [r9 + 8]
0x140619eb1: 4c634004 movsxd r8, dword ptr [rax + 4]
0x140619eb5: 43817c0818e7030000 cmp dword ptr [r8 + r9 + 0x18], 0x3e7
0x140619ebe: 7426 je 0x140619ee6
0x140619ec0: 488d81b4010000 lea rax, [rcx + 0x1b4]
0x140619ec7: 4883c124 add rcx, 0x24
0x140619ecb: 84d2 test dl, dl
0x140619ecd: 480f44c8 cmove rcx, rax
0x140619ed1: 803900 cmp byte ptr [rcx], 0
0x140619ed4: 7410 je 0x140619ee6
0x140619ed6: 84d2 test dl, dl
0x140619ed8: 7508 jne 0x140619ee2
0x140619eda: 389309040000 cmp byte ptr [rbx + 0x409], dl
0x140619ee0: 7504 jne 0x140619ee6
0x140619ee2: b001 mov al, 1
0x140619ee4: eb02 jmp 0x140619ee8
0x140619ee6: 32c0 xor al, al
0x140619ee8: 4084ff test dil, dil
0x140619eeb: 884530 mov byte ptr [rbp + 0x30], al
0x140619eee: b925000000 mov ecx, 0x25
0x140619ef3: bab5010000 mov edx, 0x1b5
0x140619ef8: 0f44ca cmove ecx, edx
0x140619efb: 4803cb add rcx, rbx
0x140619efe: 48894d38 mov qword ptr [rbp + 0x38], rcx
0x140619f02: 3a01 cmp al, byte ptr [rcx]
0x140619f04: 0f84fb010000 je 0x14061a105
0x140619f0a: 488b0da70a5e01 mov rcx, qword ptr [rip + 0x15e0aa7]
0x140619f11: 4885c9 test rcx, rcx
0x140619f14: 0f84e1010000 je 0x14061a0fb
0x140619f1a: 488b5160 mov rdx, qword ptr [rcx + 0x60]
0x140619f1e: 4c89642468 mov qword ptr [rsp + 0x68], r12
0x140619f23: 4885d2 test rdx, rdx
0x140619f26: 7428 je 0x140619f50
0x140619f28: 4084ff test dil, dil
0x140619f2b: 41b85c020000 mov r8d, 0x25c
0x140619f31: b8cc000000 mov eax, 0xcc
0x140619f36: 410f44c0 cmove eax, r8d
0x140619f3a: 448b0418 mov r8d, dword ptr [rax + rbx]
0x140619f3e: 443b415c cmp r8d, dword ptr [rcx + 0x5c]
0x140619f42: 730c jae 0x140619f50
0x140619f44: 4d69e0180f0000 imul r12, r8, 0xf18
0x140619f4b: 4c03e2 add r12, rdx
0x140619f4e: eb03 jmp 0x140619f53
0x140619f50: 4533e4 xor r12d, r12d
0x140619f53: 4d85e4 test r12, r12
0x140619f56: 0f849a010000 je 0x14061a0f6
0x140619f5c: 4889b42490000000 mov qword ptr [rsp + 0x90], rsi
0x140619f64: 488d4dc0 lea rcx, [rbp - 0x40]
0x140619f68: b848020000 mov eax, 0x248
0x140619f6d: 4c896c2460 mov qword ptr [rsp + 0x60], r13
0x140619f72: 4084ff test dil, dil
0x140619f75: 4c89742458 mov qword ptr [rsp + 0x58], r14
0x140619f7a: bab8000000 mov edx, 0xb8
0x140619f7f: 4c897c2450 mov qword ptr [rsp + 0x50], r15
0x140619f84: 0f44d0 cmove edx, eax
0x140619f87: 4533c0 xor r8d, r8d
0x140619f8a: 4803d3 add rdx, rbx
0x140619f8d: e81eec0600 call 0x140688bb0
0x140619f92: 807d3000 cmp byte ptr [rbp + 0x30], 0
0x140619f96: 0f848b010000 je 0x14061a127
0x140619f9c: 807dc800 cmp byte ptr [rbp - 0x38], 0
0x140619fa0: 0f8539010000 jne 0x14061a0df
0x140619fa6: 4c8b75c0 mov r14, qword ptr [rbp - 0x40]
0x140619faa: 4084ff test dil, dil
0x140619fad: 8b7dd4 mov edi, dword ptr [rbp - 0x2c]
0x140619fb0: b8a8020000 mov eax, 0x2a8
0x140619fb5: 41bf18010000 mov r15d, 0x118
0x140619fbb: 440f44f8 cmove r15d, eax
0x140619fbf: 4c03fb add r15, rbx
0x140619fc2: 8b5dd8 mov ebx, dword ptr [rbp - 0x28]
0x140619fc5: 6666660f1f840000000000 nop word ptr [rax + rax]
0x140619fd0: 418b5710 mov edx, dword ptr [r15 + 0x10]
0x140619fd4: 418b4f1c mov ecx, dword ptr [r15 + 0x1c]
0x140619fd8: 448b6dd0 mov r13d, dword ptr [rbp - 0x30]
0x140619fdc: 8b75cc mov esi, dword ptr [rbp - 0x34]
0x140619fdf: 3bd1 cmp edx, ecx
0x140619fe1: 0f8fae000000 jg 0x14061a095
0x140619fe7: 418b4714 mov eax, dword ptr [r15 + 0x14]
0x140619feb: 413b4720 cmp eax, dword ptr [r15 + 0x20]
0x140619fef: 0f8fa0000000 jg 0x14061a095
0x140619ff5: 3bf2 cmp esi, edx
0x140619ff7: 0f8c98000000 jl 0x14061a095
0x140619ffd: 443be8 cmp r13d, eax
0x14061a000: 0f858f000000 jne 0x14061a095
0x14061a006: 458b4718 mov r8d, dword ptr [r15 + 0x18]
0x14061a00a: 413bf8 cmp edi, r8d
0x14061a00d: 0f8c82000000 jl 0x14061a095
0x14061a013: 3bf1 cmp esi, ecx
0x14061a015: 7f7e jg 0x14061a095
0x14061a017: 413b7f24 cmp edi, dword ptr [r15 + 0x24]
0x14061a01b: 7f78 jg 0x14061a095
0x14061a01d: 2bca sub ecx, edx
0x14061a01f: 8bc7 mov eax, edi
0x14061a021: ffc1 inc ecx
0x14061a023: 412bc0 sub eax, r8d
0x14061a026: 0fafc8 imul ecx, eax
0x14061a029: 498b07 mov rax, qword ptr [r15]
0x14061a02c: 2bca sub ecx, edx
0x14061a02e: 03ce add ecx, esi
0x14061a030: 8bd1 mov edx, ecx
0x14061a032: 48c1e905 shr rcx, 5
0x14061a036: 83e21f and edx, 0x1f
0x14061a039: 8b0c88 mov ecx, dword ptr [rax + rcx*4]
0x14061a03c: 0fa3d1 bt ecx, edx
0x14061a03f: 7354 jae 0x14061a095
0x14061a041: 807d2800 cmp byte ptr [rbp + 0x28], 0
0x14061a045: 7412 je 0x14061a059
0x14061a047: 498b8c2488090000 mov rcx, qword ptr [r12 + 0x988]
0x14061a04f: 4d8d8c2498090000 lea r9, [r12 + 0x998]
0x14061a057: eb10 jmp 0x14061a069
0x14061a059: 498b8c2490090000 mov rcx, qword ptr [r12 + 0x990]
0x14061a061: 4d8d8c24c8090000 lea r9, [r12 + 0x9c8]
0x14061a069: 4885c9 test rcx, rcx
0x14061a06c: 7427 je 0x14061a095
0x14061a06e: 413b7c2404 cmp edi, dword ptr [r12 + 4]
0x14061a073: 7320 jae 0x14061a095
0x14061a075: 418b0424 mov eax, dword ptr [r12]
0x14061a079: 3bf0 cmp esi, eax
0x14061a07b: 7318 jae 0x14061a095
0x14061a07d: 0fafc7 imul eax, edi