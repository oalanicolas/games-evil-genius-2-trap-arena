0x14061a5f0: 4056 push rsi
0x14061a5f2: 4157 push r15
0x14061a5f4: 48837a2800 cmp qword ptr [rdx + 0x28], 0
0x14061a5f9: 4c8bfa mov r15, rdx
0x14061a5fc: 8b4224 mov eax, dword ptr [rdx + 0x24]
0x14061a5ff: 7505 jne 0x14061a606
0x14061a601: 8b7220 mov esi, dword ptr [rdx + 0x20]
0x14061a604: eb08 jmp 0x14061a60e
0x14061a606: 33f6 xor esi, esi
0x14061a608: 85c0 test eax, eax
0x14061a60a: 480f44f0 cmove rsi, rax
0x14061a60e: 483bf0 cmp rsi, rax
0x14061a611: 0f8302030000 jae 0x14061a919
0x14061a617: 48895c2418 mov qword ptr [rsp + 0x18], rbx
0x14061a61c: 48896c2420 mov qword ptr [rsp + 0x20], rbp
0x14061a621: 48897c2428 mov qword ptr [rsp + 0x28], rdi
0x14061a626: 4c89742430 mov qword ptr [rsp + 0x30], r14
0x14061a62b: 0f1f440000 nop dword ptr [rax + rax]
0x14061a630: 4d8b5f28 mov r11, qword ptr [r15 + 0x28]
0x14061a634: 458b5010 mov r10d, dword ptr [r8 + 0x10]
0x14061a638: 418b780c mov edi, dword ptr [r8 + 0xc]
0x14061a63c: 418b6804 mov ebp, dword ptr [r8 + 4]
0x14061a640: 8bc6 mov eax, esi
0x14061a642: 4c69f0b8000000 imul r14, rax, 0xb8
0x14061a649: 430fbf1c1e movsx ebx, word ptr [r14 + r11]
0x14061a64e: 470fbf4c1e02 movsx r9d, word ptr [r14 + r11 + 2]
0x14061a654: 8bc3 mov eax, ebx
0x14061a656: 410faf580c imul ebx, dword ptr [r8 + 0xc]
0x14061a65b: 410fafc2 imul eax, r10d
0x14061a65f: 410faff9 imul edi, r9d
0x14061a663: 450fafd1 imul r10d, r9d
0x14061a667: 2bf8 sub edi, eax
0x14061a669: 410338 add edi, dword ptr [r8]
0x14061a66c: 4103da add ebx, r10d
0x14061a66f: 41035808 add ebx, dword ptr [r8 + 8]
0x14061a673: 43807c1e0600 cmp byte ptr [r14 + r11 + 6], 0
0x14061a679: 747a je 0x14061a6f5
0x14061a67b: 418b8888000000 mov ecx, dword ptr [r8 + 0x88]
0x14061a682: 418b9094000000 mov edx, dword ptr [r8 + 0x94]
0x14061a689: 3bca cmp ecx, edx
0x14061a68b: 7f68 jg 0x14061a6f5
0x14061a68d: 418b808c000000 mov eax, dword ptr [r8 + 0x8c]
0x14061a694: 413b8098000000 cmp eax, dword ptr [r8 + 0x98]
0x14061a69b: 7f58 jg 0x14061a6f5
0x14061a69d: 3bf9 cmp edi, ecx
0x14061a69f: 7c54 jl 0x14061a6f5
0x14061a6a1: 3be8 cmp ebp, eax
0x14061a6a3: 7550 jne 0x14061a6f5
0x14061a6a5: 458b8890000000 mov r9d, dword ptr [r8 + 0x90]
0x14061a6ac: 413bd9 cmp ebx, r9d
0x14061a6af: 7c44 jl 0x14061a6f5
0x14061a6b1: 3bfa cmp edi, edx
0x14061a6b3: 7f40 jg 0x14061a6f5
0x14061a6b5: 413b989c000000 cmp ebx, dword ptr [r8 + 0x9c]
0x14061a6bc: 7f37 jg 0x14061a6f5
0x14061a6be: 2bd1 sub edx, ecx
0x14061a6c0: 8bc3 mov eax, ebx
0x14061a6c2: ffc2 inc edx
0x14061a6c4: 412bc1 sub eax, r9d
0x14061a6c7: 0fafd0 imul edx, eax
0x14061a6ca: 498b4078 mov rax, qword ptr [r8 + 0x78]
0x14061a6ce: 2bd1 sub edx, ecx
0x14061a6d0: 03d7 add edx, edi
0x14061a6d2: 8bca mov ecx, edx
0x14061a6d4: 48c1ea05 shr rdx, 5
0x14061a6d8: 4c8d0c90 lea r9, [rax + rdx*4]
0x14061a6dc: 83e11f and ecx, 0x1f
0x14061a6df: 418b11 mov edx, dword ptr [r9]
0x14061a6e2: b801000000 mov eax, 1
0x14061a6e7: 0fb3ca btr edx, ecx
0x14061a6ea: d3e0 shl eax, cl
0x14061a6ec: 0bd0 or edx, eax
0x14061a6ee: 418911 mov dword ptr [r9], edx
0x14061a6f1: 4d8b5f28 mov r11, qword ptr [r15 + 0x28]
0x14061a6f5: 43807c330400 cmp byte ptr [r11 + r14 + 4], 0
0x14061a6fb: 746e je 0x14061a76b
0x14061a6fd: 418b5058 mov edx, dword ptr [r8 + 0x58]
0x14061a701: 418b4864 mov ecx, dword ptr [r8 + 0x64]
0x14061a705: 3bd1 cmp edx, ecx
0x14061a707: 7f62 jg 0x14061a76b
0x14061a709: 418b405c mov eax, dword ptr [r8 + 0x5c]
0x14061a70d: 413b4068 cmp eax, dword ptr [r8 + 0x68]
0x14061a711: 7f58 jg 0x14061a76b
0x14061a713: 3bfa cmp edi, edx
0x14061a715: 7c54 jl 0x14061a76b
0x14061a717: 3be8 cmp ebp, eax
0x14061a719: 7550 jne 0x14061a76b
0x14061a71b: 458b4860 mov r9d, dword ptr [r8 + 0x60]
0x14061a71f: 413bd9 cmp ebx, r9d
0x14061a722: 7c47 jl 0x14061a76b
0x14061a724: 3bf9 cmp edi, ecx
0x14061a726: 7f43 jg 0x14061a76b
0x14061a728: 413b586c cmp ebx, dword ptr [r8 + 0x6c]
0x14061a72c: 7f3d jg 0x14061a76b
0x14061a72e: 2bca sub ecx, edx
0x14061a730: 8bc3 mov eax, ebx
0x14061a732: ffc1 inc ecx
0x14061a734: 412bc1 sub eax, r9d
0x14061a737: 0fafc8 imul ecx, eax
0x14061a73a: 498b4048 mov rax, qword ptr [r8 + 0x48]
0x14061a73e: 2bca sub ecx, edx
0x14061a740: ba01000000 mov edx, 1
0x14061a745: 03cf add ecx, edi
0x14061a747: 448bd1 mov r10d, ecx
0x14061a74a: 48c1e905 shr rcx, 5
0x14061a74e: 4c8d0c88 lea r9, [rax + rcx*4]
0x14061a752: 4183e21f and r10d, 0x1f
0x14061a756: 418b01 mov eax, dword ptr [r9]
0x14061a759: 418bca mov ecx, r10d
0x14061a75c: 440fb3d0 btr eax, r10d
0x14061a760: d3e2 shl edx, cl
0x14061a762: 0bd0 or edx, eax
0x14061a764: 418911 mov dword ptr [r9], edx
0x14061a767: 4d8b5f28 mov r11, qword ptr [r15 + 0x28]
0x14061a76b: 43807c1e0500 cmp byte ptr [r14 + r11 + 5], 0
0x14061a771: 746e je 0x14061a7e1
0x14061a773: 418b5028 mov edx, dword ptr [r8 + 0x28]
0x14061a777: 418b4834 mov ecx, dword ptr [r8 + 0x34]
0x14061a77b: 3bd1 cmp edx, ecx
0x14061a77d: 7f62 jg 0x14061a7e1
0x14061a77f: 418b402c mov eax, dword ptr [r8 + 0x2c]
0x14061a783: 413b4038 cmp eax, dword ptr [r8 + 0x38]
0x14061a787: 7f58 jg 0x14061a7e1
0x14061a789: 3bfa cmp edi, edx
0x14061a78b: 7c54 jl 0x14061a7e1
0x14061a78d: 3be8 cmp ebp, eax
0x14061a78f: 7550 jne 0x14061a7e1
0x14061a791: 458b4830 mov r9d, dword ptr [r8 + 0x30]
0x14061a795: 413bd9 cmp ebx, r9d
0x14061a798: 7c47 jl 0x14061a7e1
0x14061a79a: 3bf9 cmp edi, ecx
0x14061a79c: 7f43 jg 0x14061a7e1
0x14061a79e: 413b583c cmp ebx, dword ptr [r8 + 0x3c]
0x14061a7a2: 7f3d jg 0x14061a7e1
0x14061a7a4: 2bca sub ecx, edx
0x14061a7a6: 8bc3 mov eax, ebx
0x14061a7a8: ffc1 inc ecx
0x14061a7aa: 412bc1 sub eax, r9d
0x14061a7ad: 0fafc8 imul ecx, eax
0x14061a7b0: 498b4018 mov rax, qword ptr [r8 + 0x18]
0x14061a7b4: 2bca sub ecx, edx
0x14061a7b6: ba01000000 mov edx, 1
0x14061a7bb: 03cf add ecx, edi
0x14061a7bd: 448bd1 mov r10d, ecx
0x14061a7c0: 48c1e905 shr rcx, 5
0x14061a7c4: 4c8d0c88 lea r9, [rax + rcx*4]
0x14061a7c8: 4183e21f and r10d, 0x1f
0x14061a7cc: 418b01 mov eax, dword ptr [r9]
0x14061a7cf: 418bca mov ecx, r10d
0x14061a7d2: 440fb3d0 btr eax, r10d
0x14061a7d6: d3e2 shl edx, cl
0x14061a7d8: 0bd0 or edx, eax
0x14061a7da: 418911 mov dword ptr [r9], edx
0x14061a7dd: 4d8b5f28 mov r11, qword ptr [r15 + 0x28]
0x14061a7e1: 43807c1e0700 cmp byte ptr [r14 + r11 + 7], 0
0x14061a7e7: 0f8483000000 je 0x14061a870
0x14061a7ed: 418b9018010000 mov edx, dword ptr [r8 + 0x118]
0x14061a7f4: 418b8824010000 mov ecx, dword ptr [r8 + 0x124]
0x14061a7fb: 3bd1 cmp edx, ecx
0x14061a7fd: 7f71 jg 0x14061a870
0x14061a7ff: 418b801c010000 mov eax, dword ptr [r8 + 0x11c]
0x14061a806: 413b8028010000 cmp eax, dword ptr [r8 + 0x128]
0x14061a80d: 7f61 jg 0x14061a870
0x14061a80f: 3bfa cmp edi, edx
0x14061a811: 7c5d jl 0x14061a870
0x14061a813: 3be8 cmp ebp, eax
0x14061a815: 7559 jne 0x14061a870
0x14061a817: 458b8820010000 mov r9d, dword ptr [r8 + 0x120]
0x14061a81e: 413bd9 cmp ebx, r9d
0x14061a821: 7c4d jl 0x14061a870
0x14061a823: 3bf9 cmp edi, ecx
0x14061a825: 7f49 jg 0x14061a870
0x14061a827: 413b982c010000 cmp ebx, dword ptr [r8 + 0x12c]
0x14061a82e: 7f40 jg 0x14061a870
0x14061a830: 2bca sub ecx, edx
0x14061a832: 8bc3 mov eax, ebx
0x14061a834: ffc1 inc ecx
0x14061a836: 412bc1 sub eax, r9d
0x14061a839: 0fafc8 imul ecx, eax
0x14061a83c: 498b8008010000 mov rax, qword ptr [r8 + 0x108]
0x14061a843: 2bca sub ecx, edx
0x14061a845: ba01000000 mov edx, 1
0x14061a84a: 03cf add ecx, edi
0x14061a84c: 448bd1 mov r10d, ecx
0x14061a84f: 48c1e905 shr rcx, 5
0x14061a853: 4c8d0c88 lea r9, [rax + rcx*4]
0x14061a857: 4183e21f and r10d, 0x1f
0x14061a85b: 418b01 mov eax, dword ptr [r9]
0x14061a85e: 418bca mov ecx, r10d
0x14061a861: 440fb3d0 btr eax, r10d
0x14061a865: d3e2 shl edx, cl
0x14061a867: 0bd0 or edx, eax
0x14061a869: 418911 mov dword ptr [r9], edx
0x14061a86c: 4d8b5f28 mov r11, qword ptr [r15 + 0x28]
0x14061a870: 43807c1e0800 cmp byte ptr [r14 + r11 + 8], 0
0x14061a876: 747d je 0x14061a8f5
0x14061a878: 418b8848010000 mov ecx, dword ptr [r8 + 0x148]
0x14061a87f: 418b8054010000 mov eax, dword ptr [r8 + 0x154]
0x14061a886: 3bc8 cmp ecx, eax
0x14061a888: 7f6b jg 0x14061a8f5
0x14061a88a: 418b904c010000 mov edx, dword ptr [r8 + 0x14c]
0x14061a891: 413b9058010000 cmp edx, dword ptr [r8 + 0x158]
0x14061a898: 7f5b jg 0x14061a8f5
0x14061a89a: 3bf9 cmp edi, ecx
0x14061a89c: 7c57 jl 0x14061a8f5
0x14061a89e: 3bea cmp ebp, edx
0x14061a8a0: 7553 jne 0x14061a8f5
0x14061a8a2: 418b9050010000 mov edx, dword ptr [r8 + 0x150]
0x14061a8a9: 3bda cmp ebx, edx
0x14061a8ab: 7c48 jl 0x14061a8f5
0x14061a8ad: 3bf8 cmp edi, eax
0x14061a8af: 7f44 jg 0x14061a8f5
0x14061a8b1: 413b985c010000 cmp ebx, dword ptr [r8 + 0x15c]
0x14061a8b8: 7f3b jg 0x14061a8f5
0x14061a8ba: 2bc1 sub eax, ecx
0x14061a8bc: 2bda sub ebx, edx
0x14061a8be: ffc0 inc eax
0x14061a8c0: ba01000000 mov edx, 1
0x14061a8c5: 0fafc3 imul eax, ebx
0x14061a8c8: 2bc1 sub eax, ecx
0x14061a8ca: 03c7 add eax, edi
0x14061a8cc: 8bc8 mov ecx, eax
0x14061a8ce: 448bd0 mov r10d, eax
0x14061a8d1: 498b8038010000 mov rax, qword ptr [r8 + 0x138]
0x14061a8d8: 4183e21f and r10d, 0x1f
0x14061a8dc: 48c1e905 shr rcx, 5
0x14061a8e0: 4c8d0c88 lea r9, [rax + rcx*4]
0x14061a8e4: 418bca mov ecx, r10d
0x14061a8e7: 418b01 mov eax, dword ptr [r9]
0x14061a8ea: 440fb3d0 btr eax, r10d
0x14061a8ee: d3e2 shl edx, cl
0x14061a8f0: 0bd0 or edx, eax
0x14061a8f2: 418911 mov dword ptr [r9], edx
0x14061a8f5: 418b4724 mov eax, dword ptr [r15 + 0x24]
0x14061a8f9: 48ffc6 inc rsi
0x14061a8fc: 483bf0 cmp rsi, rax
0x14061a8ff: 0f822bfdffff jb 0x14061a630
0x14061a905: 4c8b742430 mov r14, qword ptr [rsp + 0x30]
0x14061a90a: 488b7c2428 mov rdi, qword ptr [rsp + 0x28]
0x14061a90f: 488b6c2420 mov rbp, qword ptr [rsp + 0x20]
0x14061a914: 488b5c2418 mov rbx, qword ptr [rsp + 0x18]
0x14061a919: 415f pop r15
0x14061a91b: 5e pop rsi
0x14061a91c: c3 ret 
0x14061a91d: cc int3 
0x14061a91e: cc int3 
0x14061a91f: cc int3 