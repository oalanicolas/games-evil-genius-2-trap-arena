0x14061a920: 4c89442418 mov qword ptr [rsp + 0x18], r8
0x14061a925: 4889542410 mov qword ptr [rsp + 0x10], rdx
0x14061a92a: 48894c2408 mov qword ptr [rsp + 8], rcx
0x14061a92f: 55 push rbp
0x14061a930: 53 push rbx
0x14061a931: 56 push rsi
0x14061a932: 57 push rdi
0x14061a933: 4154 push r12
0x14061a935: 4155 push r13
0x14061a937: 4156 push r14
0x14061a939: 4157 push r15
0x14061a93b: 488d6c24e1 lea rbp, [rsp - 0x1f]
0x14061a940: 4881ecb8000000 sub rsp, 0xb8
0x14061a947: 498db068010000 lea rsi, [r8 + 0x168]
0x14061a94e: 4c8bf9 mov r15, rcx
0x14061a951: 488bce mov rcx, rsi
0x14061a954: 4d8be8 mov r13, r8
0x14061a957: 4c8bf2 mov r14, rdx
0x14061a95a: e8d11c0000 call 0x14061c630
0x14061a95f: 458b6624 mov r12d, dword ptr [r14 + 0x24]
0x14061a963: 4533d2 xor r10d, r10d
0x14061a966: 443b6608 cmp r12d, dword ptr [rsi + 8]
0x14061a96a: 0f86cb000000 jbe 0x14061aa3b
0x14061a970: 488b0e mov rcx, qword ptr [rsi]
0x14061a973: 4885c9 test rcx, rcx
0x14061a976: 750e jne 0x14061a986
0x14061a978: 438d0c64 lea ecx, [r12 + r12*2]
0x14061a97c: c1e104 shl ecx, 4
0x14061a97f: e8fcf73c00 call 0x1409ea180
0x14061a984: eb0e jmp 0x14061a994
0x14061a986: 488b01 mov rax, qword ptr [rcx]
0x14061a989: 458bc4 mov r8d, r12d
0x14061a98c: ba30000000 mov edx, 0x30
0x14061a991: ff5018 call qword ptr [rax + 0x18]
0x14061a994: 4c8bf8 mov r15, rax
0x14061a997: 4885c0 test rax, rax
0x14061a99a: 0f8494000000 je 0x14061aa34
0x14061a9a0: 4533f6 xor r14d, r14d
0x14061a9a3: 4439760c cmp dword ptr [rsi + 0xc], r14d
0x14061a9a7: 7662 jbe 0x14061aa0b
0x14061a9a9: 0f1f8000000000 nop dword ptr [rax]
0x14061a9b0: 4c8b4610 mov r8, qword ptr [rsi + 0x10]
0x14061a9b4: 4b8d1c76 lea rbx, [r14 + r14*2]
0x14061a9b8: 48c1e304 shl rbx, 4
0x14061a9bc: 418bd6 mov edx, r14d
0x14061a9bf: 4c03c3 add r8, rbx
0x14061a9c2: 498bcf mov rcx, r15
0x14061a9c5: e8062b0000 call 0x14061d4d0
0x14061a9ca: 488b7e10 mov rdi, qword ptr [rsi + 0x10]
0x14061a9ce: 488b4c3b18 mov rcx, qword ptr [rbx + rdi + 0x18]
0x14061a9d3: c7443b2400000000 mov dword ptr [rbx + rdi + 0x24], 0
0x14061a9db: 4885c9 test rcx, rcx
0x14061a9de: 750c jne 0x14061a9ec
0x14061a9e0: 488b4c3b28 mov rcx, qword ptr [rbx + rdi + 0x28]
0x14061a9e5: e852f73c00 call 0x1409ea13c
0x14061a9ea: eb0b jmp 0x14061a9f7
0x14061a9ec: 488b01 mov rax, qword ptr [rcx]
0x14061a9ef: 488b543b28 mov rdx, qword ptr [rbx + rdi + 0x28]
0x14061a9f4: ff5020 call qword ptr [rax + 0x20]
0x14061a9f7: 33c0 xor eax, eax
0x14061a9f9: 41ffc6 inc r14d
0x14061a9fc: 4889443b28 mov qword ptr [rbx + rdi + 0x28], rax
0x14061aa01: 89443b20 mov dword ptr [rbx + rdi + 0x20], eax
0x14061aa05: 443b760c cmp r14d, dword ptr [rsi + 0xc]
0x14061aa09: 72a5 jb 0x14061a9b0
0x14061aa0b: 488b0e mov rcx, qword ptr [rsi]
0x14061aa0e: 4885c9 test rcx, rcx
0x14061aa11: 750b jne 0x14061aa1e
0x14061aa13: 488b4e10 mov rcx, qword ptr [rsi + 0x10]
0x14061aa17: e820f73c00 call 0x1409ea13c
0x14061aa1c: eb0a jmp 0x14061aa28
0x14061aa1e: 488b01 mov rax, qword ptr [rcx]
0x14061aa21: 488b5610 mov rdx, qword ptr [rsi + 0x10]
0x14061aa25: ff5020 call qword ptr [rax + 0x20]
0x14061aa28: 4c8b756f mov r14, qword ptr [rbp + 0x6f]
0x14061aa2c: 4c897e10 mov qword ptr [rsi + 0x10], r15
0x14061aa30: 44896608 mov dword ptr [rsi + 8], r12d
0x14061aa34: 4c8b7d67 mov r15, qword ptr [rbp + 0x67]
0x14061aa38: 4533d2 xor r10d, r10d
0x14061aa3b: 49837e2800 cmp qword ptr [r14 + 0x28], 0
0x14061aa40: 418b4624 mov eax, dword ptr [r14 + 0x24]
0x14061aa44: 7506 jne 0x14061aa4c
0x14061aa46: 418b7e20 mov edi, dword ptr [r14 + 0x20]
0x14061aa4a: eb09 jmp 0x14061aa55
0x14061aa4c: 85c0 test eax, eax
0x14061aa4e: 498bfa mov rdi, r10
0x14061aa51: 480f44f8 cmove rdi, rax
0x14061aa55: 48897d8f mov qword ptr [rbp - 0x71], rdi
0x14061aa59: 483bf8 cmp rdi, rax
0x14061aa5c: 0f8381020000 jae 0x14061ace3
0x14061aa62: 0f29b424a0000000 movaps xmmword ptr [rsp + 0xa0], xmm6
0x14061aa6a: 0f57f6 xorps xmm6, xmm6
0x14061aa6d: 0f1f00 nop dword ptr [rax]
0x14061aa70: 418b5510 mov edx, dword ptr [r13 + 0x10]
0x14061aa74: 8bca mov ecx, edx
0x14061aa76: 458b4d0c mov r9d, dword ptr [r13 + 0xc]
0x14061aa7a: 458bc1 mov r8d, r9d
0x14061aa7d: 418b7508 mov esi, dword ptr [r13 + 8]
0x14061aa81: 41f7d8 neg r8d
0x14061aa84: 8bc7 mov eax, edi
0x14061aa86: 4869d8b8000000 imul rbx, rax, 0xb8
0x14061aa8d: 418b4504 mov eax, dword ptr [r13 + 4]
0x14061aa91: 49035e28 add rbx, qword ptr [r14 + 0x28]
0x14061aa95: 8945cb mov dword ptr [rbp - 0x35], eax
0x14061aa98: 48895d97 mov qword ptr [rbp - 0x69], rbx
0x14061aa9c: c745ab00000000 mov dword ptr [rbp - 0x55], 0
0x14061aaa3: 0fbf4302 movsx eax, word ptr [rbx + 2]
0x14061aaa7: 440fafc8 imul r9d, eax
0x14061aaab: 0fafc8 imul ecx, eax
0x14061aaae: 0fbf03 movsx eax, word ptr [rbx]
0x14061aab1: 0fafd0 imul edx, eax
0x14061aab4: 440fafc0 imul r8d, eax
0x14061aab8: 8b0532514001 mov eax, dword ptr [rip + 0x1405132]
0x14061aabe: 89459f mov dword ptr [rbp - 0x61], eax
0x14061aac1: 8b052d514001 mov eax, dword ptr [rip + 0x140512d]
0x14061aac7: 442bca sub r9d, edx
0x14061aaca: 8945a3 mov dword ptr [rbp - 0x5d], eax
0x14061aacd: 45034d00 add r9d, dword ptr [r13]
0x14061aad1: 412bf0 sub esi, r8d
0x14061aad4: 8b051e514001 mov eax, dword ptr [rip + 0x140511e]
0x14061aada: 03f1 add esi, ecx
0x14061aadc: 488d4daf lea rcx, [rbp - 0x51]
0x14061aae0: 44894d87 mov dword ptr [rbp - 0x79], r9d
0x14061aae4: ba04000000 mov edx, 4
0x14061aae9: 44894dc7 mov dword ptr [rbp - 0x39], r9d
0x14061aaed: 89757f mov dword ptr [rbp + 0x7f], esi
0x14061aaf0: 8945a7 mov dword ptr [rbp - 0x59], eax
0x14061aaf3: 4c8955af mov qword ptr [rbp - 0x51], r10
0x14061aaf7: 48c745b700000000 mov qword ptr [rbp - 0x49], 0
0x14061aaff: 4c8955bf mov qword ptr [rbp - 0x41], r10
0x14061ab03: e88858b4ff call 0x140160390
0x14061ab08: 448b45b7 mov r8d, dword ptr [rbp - 0x49]
0x14061ab0c: 4883c318 add rbx, 0x18
0x14061ab10: 8b4dbb mov ecx, dword ptr [rbp - 0x45]
0x14061ab13: ba04000000 mov edx, 4
0x14061ab18: 4c8b65bf mov r12, qword ptr [rbp - 0x41]
0x14061ab1c: 0f1f4000 nop dword ptr [rax]
0x14061ab20: 66833b00 cmp word ptr [rbx], 0
0x14061ab24: 7421 je 0x14061ab47
0x14061ab26: 48895dd7 mov qword ptr [rbp - 0x29], rbx
0x14061ab2a: c745dfcaf24971 mov dword ptr [rbp - 0x21], 0x7149f2ca
0x14061ab31: 8bc1 mov eax, ecx
0x14061ab33: 413bc8 cmp ecx, r8d
0x14061ab36: 730f jae 0x14061ab47
0x14061ab38: 0f1045d7 movups xmm0, xmmword ptr [rbp - 0x29]
0x14061ab3c: 8d4801 lea ecx, [rax + 1]
0x14061ab3f: 4803c0 add rax, rax
0x14061ab42: 410f1104c4 movups xmmword ptr [r12 + rax*8], xmm0
0x14061ab47: 4883c328 add rbx, 0x28
0x14061ab4b: 4883ea01 sub rdx, 1
0x14061ab4f: 75cf jne 0x14061ab20
0x14061ab51: 410f2f7610 comiss xmm6, dword ptr [r14 + 0x10]
0x14061ab56: 894dbb mov dword ptr [rbp - 0x45], ecx
0x14061ab59: 8975a7 mov dword ptr [rbp - 0x59], esi
0x14061ab5c: f20f1045c7 movsd xmm0, qword ptr [rbp - 0x39]
0x14061ab61: f20f11459f movsd qword ptr [rbp - 0x61], xmm0
0x14061ab66: 0f83e2000000 jae 0x14061ac4e
0x14061ab6c: 498d5578 lea rdx, [r13 + 0x78]
0x14061ab70: 4533c0 xor r8d, r8d
0x14061ab73: 488d4de7 lea rcx, [rbp - 0x19]
0x14061ab77: bbffffffff mov ebx, 0xffffffff
0x14061ab7c: e82fe00600 call 0x140688bb0
0x14061ab81: 807def00 cmp byte ptr [rbp - 0x11], 0
0x14061ab85: 0f85aa000000 jne 0x14061ac35
0x14061ab8b: 488b75e7 mov rsi, qword ptr [rbp - 0x19]
0x14061ab8f: 448b4dff mov r9d, dword ptr [rbp - 1]
0x14061ab93: 8b7dfb mov edi, dword ptr [rbp - 5]
0x14061ab96: 448b45f3 mov r8d, dword ptr [rbp - 0xd]
0x14061ab9a: 448b7e24 mov r15d, dword ptr [rsi + 0x24]
0x14061ab9e: 448b657f mov r12d, dword ptr [rbp + 0x7f]
0x14061aba2: 448b6d87 mov r13d, dword ptr [rbp - 0x79]
0x14061aba6: 66660f1f840000000000 nop word ptr [rax + rax]
0x14061abb0: 8bc7 mov eax, edi
0x14061abb2: 412bc4 sub eax, r12d
0x14061abb5: 99 cdq 
0x14061abb6: 448bf0 mov r14d, eax
0x14061abb9: 418bc0 mov eax, r8d
0x14061abbc: 4433f2 xor r14d, edx
0x14061abbf: 412bc5 sub eax, r13d
0x14061abc2: 442bf2 sub r14d, edx
0x14061abc5: 99 cdq 
0x14061abc6: 33c2 xor eax, edx
0x14061abc8: 2bc2 sub eax, edx
0x14061abca: 4403f0 add r14d, eax
0x14061abcd: 443bf3 cmp r14d, ebx
0x14061abd0: 41ffc0 inc r8d
0x14061abd3: 440f43f3 cmovae r14d, ebx
0x14061abd7: 418bde mov ebx, r14d
0x14061abda: 413bff cmp edi, r15d
0x14061abdd: 7f46 jg 0x14061ac25
0x14061abdf: 448b561c mov r10d, dword ptr [rsi + 0x1c]
0x14061abe3: 453bc2 cmp r8d, r10d
0x14061abe6: 7f2f jg 0x14061ac17
0x14061abe8: 4c8b1e mov r11, qword ptr [rsi]
0x14061abeb: 0f1f440000 nop dword ptr [rax + rax]
0x14061abf0: 418bd1 mov edx, r9d
0x14061abf3: 8bc2 mov eax, edx
0x14061abf5: 8bca mov ecx, edx
0x14061abf7: 48c1e805 shr rax, 5
0x14061abfb: 83e11f and ecx, 0x1f
0x14061abfe: 448d4a01 lea r9d, [rdx + 1]
0x14061ac02: 418b0483 mov eax, dword ptr [r11 + rax*4]
0x14061ac06: 0fa3c8 bt eax, ecx
0x14061ac09: 0f82a1000000 jb 0x14061acb0
0x14061ac0f: 41ffc0 inc r8d
0x14061ac12: 453bc2 cmp r8d, r10d
0x14061ac15: 7ed9 jle 0x14061abf0
0x14061ac17: 448b4610 mov r8d, dword ptr [rsi + 0x10]
0x14061ac1b: ffc7 inc edi
0x14061ac1d: 418bde mov ebx, r14d
0x14061ac20: 413bff cmp edi, r15d
0x14061ac23: 7ebe jle 0x14061abe3
0x14061ac25: 4c8b65bf mov r12, qword ptr [rbp - 0x41]
0x14061ac29: 4c8b6d77 mov r13, qword ptr [rbp + 0x77]
0x14061ac2d: 488b7d8f mov rdi, qword ptr [rbp - 0x71]
0x14061ac31: 4c8b756f mov r14, qword ptr [rbp + 0x6f]
0x14061ac35: 4c8b7d67 mov r15, qword ptr [rbp + 0x67]
0x14061ac39: 0f57c0 xorps xmm0, xmm0
0x14061ac3c: 8bc3 mov eax, ebx
0x14061ac3e: f3480f2ac0 cvtsi2ss xmm0, rax
0x14061ac43: f3410f594610 mulss xmm0, dword ptr [r14 + 0x10]
0x14061ac49: f30f1145ab movss dword ptr [rbp - 0x55], xmm0
0x14061ac4e: 664183bf3203000003 cmp word ptr [r15 + 0x332], 3
0x14061ac57: 7516 jne 0x14061ac6f
0x14061ac59: f3410f108f38030000 movss xmm1, dword ptr [r15 + 0x338]
0x14061ac62: 488d4d97 lea rcx, [rbp - 0x69]
0x14061ac66: e8c53b0000 call 0x14061e830
0x14061ac6b: 4c8b65bf mov r12, qword ptr [rbp - 0x41]
0x14061ac6f: 418b9574010000 mov edx, dword ptr [r13 + 0x174]
0x14061ac76: 413b9570010000 cmp edx, dword ptr [r13 + 0x170]
0x14061ac7d: 731e jae 0x14061ac9d
0x14061ac7f: 498b8d78010000 mov rcx, qword ptr [r13 + 0x178]
0x14061ac86: 8d4201 lea eax, [rdx + 1]
0x14061ac89: 4c8d4597 lea r8, [rbp - 0x69]
0x14061ac8d: 41898574010000 mov dword ptr [r13 + 0x174], eax
0x14061ac94: e837280000 call 0x14061d4d0
0x14061ac99: 4c8b65bf mov r12, qword ptr [rbp - 0x41]
0x14061ac9d: 488b4daf mov rcx, qword ptr [rbp - 0x51]
0x14061aca1: 4885c9 test rcx, rcx
0x14061aca4: 7512 jne 0x14061acb8
0x14061aca6: 498bcc mov rcx, r12
0x14061aca9: e88ef43c00 call 0x1409ea13c
0x14061acae: eb11 jmp 0x14061acc1
0x14061acb0: 418bde mov ebx, r14d
0x14061acb3: e9f8feffff jmp 0x14061abb0
0x14061acb8: 488b01 mov rax, qword ptr [rcx]
0x14061acbb: 498bd4 mov rdx, r12
0x14061acbe: ff5020 call qword ptr [rax + 0x20]
0x14061acc1: 418b4624 mov eax, dword ptr [r14 + 0x24]
0x14061acc5: 48ffc7 inc rdi
0x14061acc8: 48897d8f mov qword ptr [rbp - 0x71], rdi
0x14061accc: 41ba00000000 mov r10d, 0
0x14061acd2: 483bf8 cmp rdi, rax
0x14061acd5: 0f8295fdffff jb 0x14061aa70
0x14061acdb: 0f28b424a0000000 movaps xmm6, xmmword ptr [rsp + 0xa0]
0x14061ace3: 4881c4b8000000 add rsp, 0xb8
0x14061acea: 415f pop r15
0x14061acec: 415e pop r14
0x14061acee: 415d pop r13
0x14061acf0: 415c pop r12
0x14061acf2: 5f pop rdi
0x14061acf3: 5e pop rsi
0x14061acf4: 5b pop rbx
0x14061acf5: 5d pop rbp
0x14061acf6: c3 ret 
0x14061acf7: cc int3 
0x14061acf8: cc int3 
0x14061acf9: cc int3 
0x14061acfa: cc int3 
0x14061acfb: cc int3 
0x14061acfc: cc int3 
0x14061acfd: cc int3 
0x14061acfe: cc int3 
0x14061acff: cc int3 