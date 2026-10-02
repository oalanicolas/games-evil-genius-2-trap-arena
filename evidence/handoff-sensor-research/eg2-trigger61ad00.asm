0x14061ad00: 4c8bdc mov r11, rsp
0x14061ad03: 55 push rbp
0x14061ad04: 4155 push r13
0x14061ad06: 498d6ba1 lea rbp, [r11 - 0x5f]
0x14061ad0a: 4881ecb8000000 sub rsp, 0xb8
0x14061ad11: 488b05a0fc5d01 mov rax, qword ptr [rip + 0x15dfca0]
0x14061ad18: 4c8be9 mov r13, rcx
0x14061ad1b: 4885c0 test rax, rax
0x14061ad1e: 0f84cf050000 je 0x14061b2f3
0x14061ad24: 488b5060 mov rdx, qword ptr [rax + 0x60]
0x14061ad28: 4d8963d8 mov qword ptr [r11 - 0x28], r12
0x14061ad2c: 4533e4 xor r12d, r12d
0x14061ad2f: 4d897bc8 mov qword ptr [r11 - 0x38], r15
0x14061ad33: 4885d2 test rdx, rdx
0x14061ad36: 7419 je 0x14061ad51
0x14061ad38: 448b81fc000000 mov r8d, dword ptr [rcx + 0xfc]
0x14061ad3f: 443b405c cmp r8d, dword ptr [rax + 0x5c]
0x14061ad43: 730c jae 0x14061ad51
0x14061ad45: 4d69f8180f0000 imul r15, r8, 0xf18
0x14061ad4c: 4c03fa add r15, rdx
0x14061ad4f: eb03 jmp 0x14061ad54
0x14061ad51: 4d8bfc mov r15, r12
0x14061ad54: 4c897dff mov qword ptr [rbp - 1], r15
0x14061ad58: 4d85ff test r15, r15
0x14061ad5b: 0f8482050000 je 0x14061b2e3
0x14061ad61: 488b05d8fc5d01 mov rax, qword ptr [rip + 0x15dfcd8]
0x14061ad68: 4885c0 test rax, rax
0x14061ad6b: 0f8472050000 je 0x14061b2e3
0x14061ad71: 488b80b0000000 mov rax, qword ptr [rax + 0xb0]
0x14061ad78: 48894507 mov qword ptr [rbp + 7], rax
0x14061ad7c: 4885c0 test rax, rax
0x14061ad7f: 0f845e050000 je 0x14061b2e3
0x14061ad85: 488b4108 mov rax, qword ptr [rcx + 8]
0x14061ad89: 4c89b42498000000 mov qword ptr [rsp + 0x98], r14
0x14061ad91: 0f29b42480000000 movaps xmmword ptr [rsp + 0x80], xmm6
0x14061ad99: 0f57f6 xorps xmm6, xmm6
0x14061ad9c: 488b8880000000 mov rcx, qword ptr [rax + 0x80]
0x14061ada3: 4885c9 test rcx, rcx
0x14061ada6: 740e je 0x14061adb6
0x14061ada8: 0f2eb1bc010000 ucomiss xmm6, dword ptr [rcx + 0x1bc]
0x14061adaf: 7405 je 0x14061adb6
0x14061adb1: 41b601 mov r14b, 1
0x14061adb4: eb03 jmp 0x14061adb9
0x14061adb6: 4532f6 xor r14b, r14b
0x14061adb9: 48899c24d0000000 mov qword ptr [rsp + 0xd0], rbx
0x14061adc1: 498d8da8030000 lea rcx, [r13 + 0x3a8]
0x14061adc8: 4889b424b0000000 mov qword ptr [rsp + 0xb0], rsi
0x14061add0: 4889bc24a8000000 mov qword ptr [rsp + 0xa8], rdi
0x14061add8: 4488756f mov byte ptr [rbp + 0x6f], r14b
0x14061addc: e80f21bcff call 0x1401dcef0
0x14061ade1: 498d5558 lea rdx, [r13 + 0x58]
0x14061ade5: 4533c0 xor r8d, r8d
0x14061ade8: 488d4dc7 lea rcx, [rbp - 0x39]
0x14061adec: e8bfdd0600 call 0x140688bb0
0x14061adf1: 443865cf cmp byte ptr [rbp - 0x31], r12b
0x14061adf5: 0f85c2020000 jne 0x14061b0bd
0x14061adfb: 448b5ddf mov r11d, dword ptr [rbp - 0x21]
0x14061adff: 8b7ddb mov edi, dword ptr [rbp - 0x25]
0x14061ae02: 8b5dd3 mov ebx, dword ptr [rbp - 0x2d]
0x14061ae05: 488b75c7 mov rsi, qword ptr [rbp - 0x39]
0x14061ae09: 44895d77 mov dword ptr [rbp + 0x77], r11d
0x14061ae0d: 897db7 mov dword ptr [rbp - 0x49], edi
0x14061ae10: 895d7f mov dword ptr [rbp + 0x7f], ebx
0x14061ae13: 0f1f4000 nop dword ptr [rax]
0x14061ae17: 660f1f840000000000 nop word ptr [rax + rax]
0x14061ae20: 418b95c8000000 mov edx, dword ptr [r13 + 0xc8]
0x14061ae27: 418b8dd4000000 mov ecx, dword ptr [r13 + 0xd4]
0x14061ae2e: 3bd1 cmp edx, ecx
0x14061ae30: 0f8f23020000 jg 0x14061b059
0x14061ae36: 418b85cc000000 mov eax, dword ptr [r13 + 0xcc]
0x14061ae3d: 413b85d8000000 cmp eax, dword ptr [r13 + 0xd8]
0x14061ae44: 0f8f0f020000 jg 0x14061b059
0x14061ae4a: 3bda cmp ebx, edx
0x14061ae4c: 0f8c07020000 jl 0x14061b059
0x14061ae52: 3945d7 cmp dword ptr [rbp - 0x29], eax
0x14061ae55: 0f85fe010000 jne 0x14061b059
0x14061ae5b: 458b85d0000000 mov r8d, dword ptr [r13 + 0xd0]
0x14061ae62: 413bf8 cmp edi, r8d
0x14061ae65: 0f8cee010000 jl 0x14061b059
0x14061ae6b: 3bd9 cmp ebx, ecx
0x14061ae6d: 0f8fe6010000 jg 0x14061b059
0x14061ae73: 413bbddc000000 cmp edi, dword ptr [r13 + 0xdc]
0x14061ae7a: 0f8fd9010000 jg 0x14061b059
0x14061ae80: 2bca sub ecx, edx
0x14061ae82: 8bc7 mov eax, edi
0x14061ae84: ffc1 inc ecx
0x14061ae86: 412bc0 sub eax, r8d
0x14061ae89: 0fafc8 imul ecx, eax
0x14061ae8c: 498b85b8000000 mov rax, qword ptr [r13 + 0xb8]
0x14061ae93: 2bca sub ecx, edx
0x14061ae95: 03cb add ecx, ebx
0x14061ae97: 8bd1 mov edx, ecx
0x14061ae99: 48c1e905 shr rcx, 5
0x14061ae9d: 83e21f and edx, 0x1f
0x14061aea0: 8b0c88 mov ecx, dword ptr [rax + rcx*4]
0x14061aea3: 0fa3d1 bt ecx, edx
0x14061aea6: 0f83ad010000 jae 0x14061b059
0x14061aeac: 8bd7 mov edx, edi
0x14061aeae: 498d8fe8010000 lea rcx, [r15 + 0x1e8]
0x14061aeb5: 410faf17 imul edx, dword ptr [r15]
0x14061aeb9: 03d3 add edx, ebx
0x14061aebb: e8100da9ff call 0x1400abbd0
0x14061aec0: 4889450f mov qword ptr [rbp + 0xf], rax
0x14061aec4: 4885c0 test rax, rax
0x14061aec7: 0f8488010000 je 0x14061b055
0x14061aecd: 83780c00 cmp dword ptr [rax + 0xc], 0
0x14061aed1: 0f867e010000 jbe 0x14061b055
0x14061aed7: 418bdc mov ebx, r12d
0x14061aeda: 660f1f440000 nop word ptr [rax + rax]
0x14061aee0: 488b08 mov rcx, qword ptr [rax]
0x14061aee3: 8bd3 mov edx, ebx
0x14061aee5: 488d34d1 lea rsi, [rcx + rdx*8]
0x14061aee9: 0fb74cd104 movzx ecx, word ptr [rcx + rdx*8 + 4]
0x14061aeee: 81e901800000 sub ecx, 0x8001
0x14061aef4: 743d je 0x14061af33
0x14061aef6: 83e902 sub ecx, 2
0x14061aef9: 7438 je 0x14061af33
0x14061aefb: 83f901 cmp ecx, 1
0x14061aefe: 7433 je 0x14061af33
0x14061af00: 4584f6 test r14b, r14b
0x14061af03: 0f8427010000 je 0x14061b030
0x14061af09: 8b16 mov edx, dword ptr [rsi]
0x14061af0b: 488d0d4e734001 lea rcx, [rip + 0x140734e]
0x14061af12: 41b001 mov r8b, 1
0x14061af15: e886eca9ff call 0x1400b9ba0
0x14061af1a: 4885c0 test rax, rax
0x14061af1d: 0f840d010000 je 0x14061b030
0x14061af23: 498bd5 mov rdx, r13
0x14061af26: 488bc8 mov rcx, rax
0x14061af29: e822381200 call 0x14073e750
0x14061af2e: e9fd000000 jmp 0x14061b030
0x14061af33: 8b0e mov ecx, dword ptr [rsi]
0x14061af35: b201 mov dl, 1
0x14061af37: e87402f1ff call 0x14052b1b0
0x14061af3c: 488bf8 mov rdi, rax
0x14061af3f: 4885c0 test rax, rax
0x14061af42: 0f84e8000000 je 0x14061b030
0x14061af48: 488b4808 mov rcx, qword ptr [rax + 8]
0x14061af4c: 4c634108 movsxd r8, dword ptr [rcx + 8]