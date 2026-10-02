0x14010f6a0: 4053 push rbx
0x14010f6a2: 55 push rbp
0x14010f6a3: 56 push rsi
0x14010f6a4: 57 push rdi
0x14010f6a5: 4154 push r12
0x14010f6a7: 4155 push r13
0x14010f6a9: 4156 push r14
0x14010f6ab: 4157 push r15
0x14010f6ad: 4883ec58 sub rsp, 0x58
0x14010f6b1: 488b058859ae00 mov rax, qword ptr [rip + 0xae5988]
0x14010f6b8: 4833c4 xor rax, rsp
0x14010f6bb: 4889442448 mov qword ptr [rsp + 0x48], rax
0x14010f6c0: 498b01 mov rax, qword ptr [r9]
0x14010f6c3: 4c8bf9 mov r15, rcx
0x14010f6c6: 33ed xor ebp, ebp
0x14010f6c8: 33f6 xor esi, esi
0x14010f6ca: 498bc9 mov rcx, r9
0x14010f6cd: 4d8bf1 mov r14, r9
0x14010f6d0: 458be8 mov r13d, r8d
0x14010f6d3: 448be2 mov r12d, edx
0x14010f6d6: ff5008 call qword ptr [rax + 8]
0x14010f6d9: b301 mov bl, 1
0x14010f6db: 0f1f440000 nop dword ptr [rax + rax]
0x14010f6e0: 33c0 xor eax, eax
0x14010f6e2: 896c2428 mov dword ptr [rsp + 0x28], ebp
0x14010f6e6: 4889442438 mov qword ptr [rsp + 0x38], rax
0x14010f6eb: 488d15f6719c00 lea rdx, [rip + 0x9c71f6]
0x14010f6f2: 440fb6cb movzx r9d, bl
0x14010f6f6: 488d4c2440 lea rcx, [rsp + 0x40]
0x14010f6fb: c744243000000000 mov dword ptr [rsp + 0x30], 0
0x14010f703: 448d4008 lea r8d, [rax + 8]
0x14010f707: 89442438 mov dword ptr [rsp + 0x38], eax
0x14010f70b: 44896c2420 mov dword ptr [rsp + 0x20], r13d
0x14010f710: e8db2a0500 call 0x1401621f0
0x14010f715: 488b442440 mov rax, qword ptr [rsp + 0x40]
0x14010f71a: 488d542440 lea rdx, [rsp + 0x40]
0x14010f71f: 418bfc mov edi, r12d
0x14010f722: 84c0 test al, al
0x14010f724: 7438 je 0x14010f75e
0x14010f726: bb2f000000 mov ebx, 0x2f
0x14010f72b: 0f1f440000 nop dword ptr [rax + rax]
0x14010f730: 8d48bf lea ecx, [rax - 0x41]
0x14010f733: 80f919 cmp cl, 0x19
0x14010f736: 7704 ja 0x14010f73c
0x14010f738: 0420 add al, 0x20
0x14010f73a: eb0b jmp 0x14010f747
0x14010f73c: 3c5c cmp al, 0x5c
0x14010f73e: 0fb6c8 movzx ecx, al
0x14010f741: 0f44cb cmove ecx, ebx
0x14010f744: 0fb6c1 movzx eax, cl
0x14010f747: 0fbec8 movsx ecx, al
0x14010f74a: 48ffc2 inc rdx
0x14010f74d: 6bff1f imul edi, edi, 0x1f
0x14010f750: 03f9 add edi, ecx
0x14010f752: 0fb60a movzx ecx, byte ptr [rdx]
0x14010f755: 0fb6c1 movzx eax, cl
0x14010f758: 84c9 test cl, cl
0x14010f75a: 75d4 jne 0x14010f730
0x14010f75c: b301 mov bl, 1
0x14010f75e: 4c8d442430 lea r8, [rsp + 0x30]
0x14010f763: 8bd7 mov edx, edi
0x14010f765: 498bcf mov rcx, r15
0x14010f768: e843ebffff call 0x14010e2b0
0x14010f76d: 84c0 test al, al
0x14010f76f: 741b je 0x14010f78c
0x14010f771: 498b06 mov rax, qword ptr [r14]
0x14010f774: 4c8d4c2430 lea r9, [rsp + 0x30]
0x14010f779: 448bc7 mov r8d, edi
0x14010f77c: 8bd6 mov edx, esi
0x14010f77e: 498bce mov rcx, r14
0x14010f781: ff5010 call qword ptr [rax + 0x10]
0x14010f784: 84c0 test al, al
0x14010f786: 744f je 0x14010f7d7
0x14010f788: ffc6 inc esi
0x14010f78a: eb04 jmp 0x14010f790
0x14010f78c: 85ed test ebp, ebp
0x14010f78e: 754b jne 0x14010f7db
0x14010f790: ffc5 inc ebp
0x14010f792: 837c243004 cmp dword ptr [rsp + 0x30], 4
0x14010f797: 0f8543ffffff jne 0x14010f6e0
0x14010f79d: 488b7c2438 mov rdi, qword ptr [rsp + 0x38]
0x14010f7a2: 4885ff test rdi, rdi
0x14010f7a5: 0f8435ffffff je 0x14010f6e0
0x14010f7ab: 488b0f mov rcx, qword ptr [rdi]
0x14010f7ae: 4885c9 test rcx, rcx
0x14010f7b1: 740a je 0x14010f7bd
0x14010f7b3: e884a98d00 call 0x1409ea13c
0x14010f7b8: 33c0 xor eax, eax
0x14010f7ba: 488907 mov qword ptr [rdi], rax
0x14010f7bd: ba10000000 mov edx, 0x10
0x14010f7c2: 48c7470800000000 mov qword ptr [rdi + 8], 0
0x14010f7ca: 488bcf mov rcx, rdi
0x14010f7cd: e86aa98d00 call 0x1409ea13c
0x14010f7d2: e909ffffff jmp 0x14010f6e0
0x14010f7d7: 33d2 xor edx, edx
0x14010f7d9: eb02 jmp 0x14010f7dd
0x14010f7db: b201 mov dl, 1
0x14010f7dd: 498b06 mov rax, qword ptr [r14]
0x14010f7e0: 498bce mov rcx, r14
0x14010f7e3: ff5018 call qword ptr [rax + 0x18]
0x14010f7e6: 837c243004 cmp dword ptr [rsp + 0x30], 4
0x14010f7eb: 7531 jne 0x14010f81e
0x14010f7ed: 488b5c2438 mov rbx, qword ptr [rsp + 0x38]
0x14010f7f2: 4885db test rbx, rbx
0x14010f7f5: 7427 je 0x14010f81e
0x14010f7f7: 488b0b mov rcx, qword ptr [rbx]
0x14010f7fa: 4885c9 test rcx, rcx
0x14010f7fd: 740a je 0x14010f809
0x14010f7ff: e838a98d00 call 0x1409ea13c
0x14010f804: 33c0 xor eax, eax
0x14010f806: 488903 mov qword ptr [rbx], rax
0x14010f809: ba10000000 mov edx, 0x10
0x14010f80e: 48c7430800000000 mov qword ptr [rbx + 8], 0
0x14010f816: 488bcb mov rcx, rbx
0x14010f819: e81ea98d00 call 0x1409ea13c
0x14010f81e: 8bc6 mov eax, esi
0x14010f820: 488b4c2448 mov rcx, qword ptr [rsp + 0x48]
0x14010f825: 4833cc xor rcx, rsp
0x14010f828: e833a48d00 call 0x1409e9c60
0x14010f82d: 4883c458 add rsp, 0x58
0x14010f831: 415f pop r15
0x14010f833: 415e pop r14
0x14010f835: 415d pop r13
0x14010f837: 415c pop r12
0x14010f839: 5f pop rdi
0x14010f83a: 5e pop rsi
0x14010f83b: 5d pop rbp
0x14010f83c: 5b pop rbx
0x14010f83d: c3 ret 
0x14010f83e: cc int3 
0x14010f83f: cc int3 
0x14010f840: 4055 push rbp
0x14010f842: 4156 push r14
0x14010f844: 4883ec28 sub rsp, 0x28
0x14010f848: 488b4118 mov rax, qword ptr [rcx + 0x18]
0x14010f84c: 33ed xor ebp, ebp