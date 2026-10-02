0x14061a4b0: 4053 push rbx
0x14061a4b2: 4883ec20 sub rsp, 0x20
0x14061a4b6: 80b94003000000 cmp byte ptr [rcx + 0x340], 0
0x14061a4bd: 4c8bd2 mov r10, rdx
0x14061a4c0: 8b4250 mov eax, dword ptr [rdx + 0x50]
0x14061a4c3: 488bd9 mov rbx, rcx
0x14061a4c6: 89813c030000 mov dword ptr [rcx + 0x33c], eax
0x14061a4cc: 750a jne 0x14061a4d8
0x14061a4ce: 807a5400 cmp byte ptr [rdx + 0x54], 0
0x14061a4d2: 7504 jne 0x14061a4d8
0x14061a4d4: 32c0 xor al, al
0x14061a4d6: eb02 jmp 0x14061a4da
0x14061a4d8: b001 mov al, 1
0x14061a4da: 888140030000 mov byte ptr [rcx + 0x340], al
0x14061a4e0: 8b4258 mov eax, dword ptr [rdx + 0x58]
0x14061a4e3: 898150030000 mov dword ptr [rcx + 0x350], eax
0x14061a4e9: 8b8944030000 mov ecx, dword ptr [rcx + 0x344]
0x14061a4ef: 3b4a14 cmp ecx, dword ptr [rdx + 0x14]
0x14061a4f2: 0f464a14 cmovbe ecx, dword ptr [rdx + 0x14]
0x14061a4f6: 898b44030000 mov dword ptr [rbx + 0x344], ecx
0x14061a4fc: 8b8b48030000 mov ecx, dword ptr [rbx + 0x348]
0x14061a502: 3b4a5c cmp ecx, dword ptr [rdx + 0x5c]
0x14061a505: 0f4e4a5c cmovle ecx, dword ptr [rdx + 0x5c]
0x14061a509: 898b48030000 mov dword ptr [rbx + 0x348], ecx
0x14061a50f: 80bb4c03000000 cmp byte ptr [rbx + 0x34c], 0
0x14061a516: 750a jne 0x14061a522
0x14061a518: 807a6000 cmp byte ptr [rdx + 0x60], 0
0x14061a51c: 7504 jne 0x14061a522
0x14061a51e: 32c0 xor al, al
0x14061a520: eb02 jmp 0x14061a524
0x14061a522: b001 mov al, 1
0x14061a524: 88834c030000 mov byte ptr [rbx + 0x34c], al
0x14061a52a: 4c8b5a28 mov r11, qword ptr [rdx + 0x28]
0x14061a52e: 33d2 xor edx, edx
0x14061a530: 4d85db test r11, r11
0x14061a533: 750a jne 0x14061a53f
0x14061a535: 418b4a20 mov ecx, dword ptr [r10 + 0x20]
0x14061a539: 418b4224 mov eax, dword ptr [r10 + 0x24]
0x14061a53d: eb0d jmp 0x14061a54c
0x14061a53f: 418b4224 mov eax, dword ptr [r10 + 0x24]
0x14061a543: 488bca mov rcx, rdx
0x14061a546: 85c0 test eax, eax
0x14061a548: 480f44c8 cmove rcx, rax
0x14061a54c: 448bc8 mov r9d, eax
0x14061a54f: 493bc9 cmp rcx, r9
0x14061a552: 735f jae 0x14061a5b3
0x14061a554: 0f1f4000 nop dword ptr [rax]
0x14061a558: 0f1f840000000000 nop dword ptr [rax + rax]
0x14061a560: 8bc1 mov eax, ecx
0x14061a562: 4c69c0b8000000 imul r8, rax, 0xb8
0x14061a569: 4d03c3 add r8, r11
0x14061a56c: 41385004 cmp byte ptr [r8 + 4], dl
0x14061a570: 750e jne 0x14061a580
0x14061a572: 48ffc1 inc rcx
0x14061a575: 493bc9 cmp rcx, r9
0x14061a578: 72e6 jb 0x14061a560
0x14061a57a: eb37 jmp 0x14061a5b3
0x14061a57c: 0f1f4000 nop dword ptr [rax]
0x14061a580: 0fb7ca movzx ecx, dx
0x14061a583: 488d0489 lea rax, [rcx + rcx*4]
0x14061a587: 458b4cc038 mov r9d, dword ptr [r8 + rax*8 + 0x38]
0x14061a58c: 4585c9 test r9d, r9d
0x14061a58f: 750b jne 0x14061a59c
0x14061a591: 66ffc2 inc dx
0x14061a594: 6683fa04 cmp dx, 4
0x14061a598: 72e6 jb 0x14061a580
0x14061a59a: eb17 jmp 0x14061a5b3
0x14061a59c: 488d0489 lea rax, [rcx + rcx*4]
0x14061a5a0: 44898b54040000 mov dword ptr [rbx + 0x454], r9d
0x14061a5a7: 410fb64cc03c movzx ecx, byte ptr [r8 + rax*8 + 0x3c]
0x14061a5ad: 888b58040000 mov byte ptr [rbx + 0x458], cl
0x14061a5b3: 83bb5404000000 cmp dword ptr [rbx + 0x454], 0
0x14061a5ba: 7522 jne 0x14061a5de
0x14061a5bc: 418b4a78 mov ecx, dword ptr [r10 + 0x78]
0x14061a5c0: 85c9 test ecx, ecx
0x14061a5c2: 741a je 0x14061a5de
0x14061a5c4: e807460500 call 0x14066ebd0
0x14061a5c9: 4885c0 test rax, rax
0x14061a5cc: 7410 je 0x14061a5de
0x14061a5ce: 8b4028 mov eax, dword ptr [rax + 0x28]
0x14061a5d1: 898354040000 mov dword ptr [rbx + 0x454], eax
0x14061a5d7: c6835904000001 mov byte ptr [rbx + 0x459], 1
0x14061a5de: 4883c420 add rsp, 0x20
0x14061a5e2: 5b pop rbx
0x14061a5e3: c3 ret 
0x14061a5e4: cc int3 
0x14061a5e5: cc int3 
0x14061a5e6: cc int3 
0x14061a5e7: cc int3 
0x14061a5e8: cc int3 
0x14061a5e9: cc int3 
0x14061a5ea: cc int3 
0x14061a5eb: cc int3 
0x14061a5ec: cc int3 
0x14061a5ed: cc int3 
0x14061a5ee: cc int3 
0x14061a5ef: cc int3 