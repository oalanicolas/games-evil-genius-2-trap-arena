0x140675170: 4885d2 test rdx, rdx
0x140675173: 0f847f050000 je 0x1406756f8
0x140675179: 4c8bdc mov r11, rsp
0x14067517c: 55 push rbp
0x14067517d: 56 push rsi
0x14067517e: 4154 push r12
0x140675180: 498d6b98 lea rbp, [r11 - 0x68]
0x140675184: 4881ec50010000 sub rsp, 0x150
0x14067518b: 488b05aefe5700 mov rax, qword ptr [rip + 0x57feae]
0x140675192: 4833c4 xor rax, rsp
0x140675195: 48894520 mov qword ptr [rbp + 0x20], rax
0x140675199: 6683790400 cmp word ptr [rcx + 4], 0
0x14067519e: 4c8be2 mov r12, rdx
0x1406751a1: 488bf1 mov rsi, rcx
0x1406751a4: 0f8437050000 je 0x1406756e1
0x1406751aa: 6683790600 cmp word ptr [rcx + 6], 0
0x1406751af: 0f842c050000 je 0x1406756e1
0x1406751b5: 49895b18 mov qword ptr [r11 + 0x18], rbx
0x1406751b9: 4c8d4c2420 lea r9, [rsp + 0x20]
0x1406751be: 33db xor ebx, ebx
0x1406751c0: 49897be0 mov qword ptr [r11 - 0x20], rdi
0x1406751c4: 4d896bd8 mov qword ptr [r11 - 0x28], r13
0x1406751c8: 488d3db9174600 lea rdi, [rip + 0x4617b9]
0x1406751cf: ba64843742 mov edx, 0x42378464
0x1406751d4: 4d8973d0 mov qword ptr [r11 - 0x30], r14
0x1406751d8: 498bcc mov rcx, r12
0x1406751db: 48895c2448 mov qword ptr [rsp + 0x48], rbx
0x1406751e0: 448d4302 lea r8d, [rbx + 2]
0x1406751e4: 48895c2450 mov qword ptr [rsp + 0x50], rbx
0x1406751e9: 48895c2458 mov qword ptr [rsp + 0x58], rbx
0x1406751ee: 48897c2420 mov qword ptr [rsp + 0x20], rdi
0x1406751f3: e8a8a4a9ff call 0x14010f6a0
0x1406751f8: 4c8d3591284700 lea r14, [rip + 0x472891]
0x1406751ff: 85c0 test eax, eax
0x140675201: 7431 je 0x140675234
0x140675203: 8bd0 mov edx, eax
0x140675205: 488d4c2448 lea rcx, [rsp + 0x48]
0x14067520a: e8b1b4a4ff call 0x1400c06c0
0x14067520f: 488d442448 lea rax, [rsp + 0x48]
0x140675214: 4c89742420 mov qword ptr [rsp + 0x20], r14
0x140675219: 4c8d4c2420 lea r9, [rsp + 0x20]
0x14067521e: 4889442428 mov qword ptr [rsp + 0x28], rax
0x140675223: ba64843742 mov edx, 0x42378464
0x140675228: 448d4302 lea r8d, [rbx + 2]
0x14067522c: 498bcc mov rcx, r12
0x14067522f: e86ca4a9ff call 0x14010f6a0
0x140675234: 4c8d4c2420 lea r9, [rsp + 0x20]
0x140675239: 48895c2430 mov qword ptr [rsp + 0x30], rbx
0x14067523e: baee39ca36 mov edx, 0x36ca39ee
0x140675243: 48895c2438 mov qword ptr [rsp + 0x38], rbx
0x140675248: 41b802000000 mov r8d, 2
0x14067524e: 48895c2440 mov qword ptr [rsp + 0x40], rbx
0x140675253: 498bcc mov rcx, r12
0x140675256: 48897c2420 mov qword ptr [rsp + 0x20], rdi
0x14067525b: e840a4a9ff call 0x14010f6a0
0x140675260: 85c0 test eax, eax
0x140675262: 7433 je 0x140675297
0x140675264: 8bd0 mov edx, eax
0x140675266: 488d4c2430 lea rcx, [rsp + 0x30]
0x14067526b: e850b4a4ff call 0x1400c06c0
0x140675270: 488d442430 lea rax, [rsp + 0x30]
0x140675275: 4c89742420 mov qword ptr [rsp + 0x20], r14
0x14067527a: 4c8d4c2420 lea r9, [rsp + 0x20]
0x14067527f: 4889442428 mov qword ptr [rsp + 0x28], rax
0x140675284: baee39ca36 mov edx, 0x36ca39ee
0x140675289: 41b802000000 mov r8d, 2
0x14067528f: 498bcc mov rcx, r12
0x140675292: e809a4a9ff call 0x14010f6a0
0x140675297: 8b542454 mov edx, dword ptr [rsp + 0x54]
0x14067529b: 488d4e18 lea rcx, [rsi + 0x18]
0x14067529f: 895e24 mov dword ptr [rsi + 0x24], ebx
0x1406752a2: e859070000 call 0x140675a00
0x1406752a7: 4533d2 xor r10d, r10d
0x1406752aa: 458bf2 mov r14d, r10d
0x1406752ad: 395c2454 cmp dword ptr [rsp + 0x54], ebx
0x1406752b1: 0f86b4030000 jbe 0x14067566b
0x1406752b7: 4c89bc2430010000 mov qword ptr [rsp + 0x130], r15
0x1406752bf: 48ba65210b59c84216b2 movabs rdx, 0xb21642c8590b2165
0x1406752c9: 0f1f8000000000 nop dword ptr [rax]
0x1406752d0: 488b442458 mov rax, qword ptr [rsp + 0x58]
0x1406752d5: 458bfe mov r15d, r14d
0x1406752d8: 428b1cb8 mov ebx, dword ptr [rax + r15*4]
0x1406752dc: 85db test ebx, ebx
0x1406752de: 743d je 0x14067531d
0x1406752e0: bab586e294 mov edx, 0x94e286b5
0x1406752e5: e846b4a9ff call 0x140110730
0x1406752ea: 4885c0 test rax, rax
0x1406752ed: 7421 je 0x140675310
0x1406752ef: 8bd3 mov edx, ebx
0x1406752f1: 488bc8 mov rcx, rax
0x1406752f4: e8b7b7a9ff call 0x140110ab0
0x1406752f9: 488bf8 mov rdi, rax
0x1406752fc: 4885c0 test rax, rax
0x1406752ff: 740f je 0x140675310
0x140675301: 4533d2 xor r10d, r10d
0x140675304: 48ba65210b59c84216b2 movabs rdx, 0xb21642c8590b2165
0x14067530e: eb10 jmp 0x140675320
0x140675310: 4533d2 xor r10d, r10d
0x140675313: 48ba65210b59c84216b2 movabs rdx, 0xb21642c8590b2165
0x14067531d: 498bfa mov rdi, r10
0x140675320: 4885ff test rdi, rdi
0x140675323: 0f841c030000 je 0x140675645
0x140675329: 0f57c0 xorps xmm0, xmm0
0x14067532c: c744246000000000 mov dword ptr [rsp + 0x60], 0
0x140675334: 0f294580 movaps xmmword ptr [rbp - 0x80], xmm0
0x140675338: 488d442478 lea rax, [rsp + 0x78]
0x14067533d: 0f2945d0 movaps xmmword ptr [rbp - 0x30], xmm0
0x140675341: b904000000 mov ecx, 4
0x140675346: c744246400000001 mov dword ptr [rsp + 0x64], 0x1000000
0x14067534e: c644246801 mov byte ptr [rsp + 0x68], 1
0x140675353: 48c744246c00000000 mov qword ptr [rsp + 0x6c], 0
0x14067535c: c744247400000000 mov dword ptr [rsp + 0x74], 0
0x140675364: 664489542478 mov word ptr [rsp + 0x78], r10w
0x14067536a: c744247c00000000 mov dword ptr [rsp + 0x7c], 0
0x140675372: c74590000080bf mov dword ptr [rbp - 0x70], 0xbf800000
0x140675379: 48c7459400000000 mov qword ptr [rbp - 0x6c], 0
0x140675381: c6459c00 mov byte ptr [rbp - 0x64], 0
0x140675385: 66448955a0 mov word ptr [rbp - 0x60], r10w
0x14067538a: 48c745a400000000 mov qword ptr [rbp - 0x5c], 0
0x140675392: 48c745ac00000000 mov qword ptr [rbp - 0x54], 0
0x14067539a: c745b400000000 mov dword ptr [rbp - 0x4c], 0
0x1406753a1: c745b8000080bf mov dword ptr [rbp - 0x48], 0xbf800000
0x1406753a8: 48c745bc00000000 mov qword ptr [rbp - 0x44], 0
0x1406753b0: c645c400 mov byte ptr [rbp - 0x3c], 0
0x1406753b4: 66448955c8 mov word ptr [rbp - 0x38], r10w
0x1406753b9: c745cc00000000 mov dword ptr [rbp - 0x34], 0
0x1406753c0: c745e0000080bf mov dword ptr [rbp - 0x20], 0xbf800000
0x1406753c7: 48c745e400000000 mov qword ptr [rbp - 0x1c], 0
0x1406753cf: c645ec00 mov byte ptr [rbp - 0x14], 0
0x1406753d3: 66448955f0 mov word ptr [rbp - 0x10], r10w
0x1406753d8: 48c745f400000000 mov qword ptr [rbp - 0xc], 0
0x1406753e0: 48c745fc00000000 mov qword ptr [rbp - 4], 0
0x1406753e8: c7450400000000 mov dword ptr [rbp + 4], 0
0x1406753ef: c74508000080bf mov dword ptr [rbp + 8], 0xbf800000
0x1406753f6: 48c7450c00000000 mov qword ptr [rbp + 0xc], 0
0x1406753fe: c6451400 mov byte ptr [rbp + 0x14], 0
0x140675402: 66448910 mov word ptr [rax], r10w
0x140675406: 488d4028 lea rax, [rax + 0x28]
0x14067540a: 4883e901 sub rcx, 1
0x14067540e: 75f2 jne 0x140675402
0x140675410: 8b4e24 mov ecx, dword ptr [rsi + 0x24]
0x140675413: 8b4620 mov eax, dword ptr [rsi + 0x20]
0x140675416: 3bc8 cmp ecx, eax
0x140675418: 720b jb 0x140675425
0x14067541a: 4c8b4e28 mov r9, qword ptr [rsi + 0x28]
0x14067541e: 8bc8 mov ecx, eax
0x140675420: e9c6000000 jmp 0x1406754eb
0x140675425: 4c69c1b8000000 imul r8, rcx, 0xb8
0x14067542c: 8d4101 lea eax, [rcx + 1]
0x14067542f: 498bca mov rcx, r10
0x140675432: 4c034628 add r8, qword ptr [rsi + 0x28]
0x140675436: 894624 mov dword ptr [rsi + 0x24], eax
0x140675439: 488d442460 lea rax, [rsp + 0x60]
0x14067543e: 0f1000 movups xmm0, xmmword ptr [rax]
0x140675441: 0f104810 movups xmm1, xmmword ptr [rax + 0x10]
0x140675445: 410f1100 movups xmmword ptr [r8], xmm0
0x140675449: 0f104020 movups xmm0, xmmword ptr [rax + 0x20]
0x14067544d: 410f114810 movups xmmword ptr [r8 + 0x10], xmm1
0x140675452: 0f104830 movups xmm1, xmmword ptr [rax + 0x30]
0x140675456: 410f114020 movups xmmword ptr [r8 + 0x20], xmm0
0x14067545b: 0f104040 movups xmm0, xmmword ptr [rax + 0x40]
0x14067545f: 410f114830 movups xmmword ptr [r8 + 0x30], xmm1
0x140675464: 0f104850 movups xmm1, xmmword ptr [rax + 0x50]
0x140675468: 410f114040 movups xmmword ptr [r8 + 0x40], xmm0
0x14067546d: 0f104060 movups xmm0, xmmword ptr [rax + 0x60]
0x140675471: 410f114850 movups xmmword ptr [r8 + 0x50], xmm1
0x140675476: 0f104870 movups xmm1, xmmword ptr [rax + 0x70]
0x14067547a: 410f114060 movups xmmword ptr [r8 + 0x60], xmm0
0x14067547f: 0f108080000000 movups xmm0, xmmword ptr [rax + 0x80]
0x140675486: 410f114870 movups xmmword ptr [r8 + 0x70], xmm1
0x14067548b: 0f108890000000 movups xmm1, xmmword ptr [rax + 0x90]
0x140675492: 410f118080000000 movups xmmword ptr [r8 + 0x80], xmm0
0x14067549a: 0f1080a0000000 movups xmm0, xmmword ptr [rax + 0xa0]
0x1406754a1: 488b80b0000000 mov rax, qword ptr [rax + 0xb0]
0x1406754a8: 410f118890000000 movups xmmword ptr [r8 + 0x90], xmm1
0x1406754b0: 410f1180a0000000 movups xmmword ptr [r8 + 0xa0], xmm0
0x1406754b8: 498980b0000000 mov qword ptr [r8 + 0xb0], rax
0x1406754bf: 488bc2 mov rax, rdx
0x1406754c2: 4c8b4e28 mov r9, qword ptr [rsi + 0x28]
0x1406754c6: 4d2bc1 sub r8, r9
0x1406754c9: 49f7e8 imul r8
0x1406754cc: 4903d0 add rdx, r8
0x1406754cf: 48c1fa07 sar rdx, 7
0x1406754d3: 488bc2 mov rax, rdx
0x1406754d6: 48c1e83f shr rax, 0x3f
0x1406754da: 4803d0 add rdx, rax
0x1406754dd: 8b4624 mov eax, dword ptr [rsi + 0x24]
0x1406754e0: 480f45ca cmovne rcx, rdx
0x1406754e4: 483bc8 cmp rcx, rax
0x1406754e7: 480f43c8 cmovae rcx, rax
0x1406754eb: 33d2 xor edx, edx
0x1406754ed: 418bc6 mov eax, r14d
0x1406754f0: 4869d9b8000000 imul rbx, rcx, 0xb8
0x1406754f7: 0fb74e04 movzx ecx, word ptr [rsi + 4]
0x1406754fb: f7f1 div ecx
0x1406754fd: 4903d9 add rbx, r9
0x140675500: 418bc6 mov eax, r14d
0x140675503: 662b5608 sub dx, word ptr [rsi + 8]
0x140675507: 668913 mov word ptr [rbx], dx
0x14067550a: 33d2 xor edx, edx
0x14067550c: 0fb74e04 movzx ecx, word ptr [rsi + 4]
0x140675510: f7f1 div ecx
0x140675512: ba1991f60e mov edx, 0xef69119
0x140675517: 488bcf mov rcx, rdi
0x14067551a: 662b460a sub ax, word ptr [rsi + 0xa]
0x14067551e: 66894302 mov word ptr [rbx + 2], ax
0x140675522: e8798ea9ff call 0x14010e3a0
0x140675527: 4885c0 test rax, rax
0x14067552a: 740b je 0x140675537
0x14067552c: 833802 cmp dword ptr [rax], 2
0x14067552f: 7506 jne 0x140675537
0x140675531: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140675535: eb02 jmp 0x140675539
0x140675537: 32c9 xor cl, cl
0x140675539: 884b04 mov byte ptr [rbx + 4], cl
0x14067553c: ba4e050c3b mov edx, 0x3b0c054e
0x140675541: 488bcf mov rcx, rdi
0x140675544: e8578ea9ff call 0x14010e3a0
0x140675549: 4885c0 test rax, rax
0x14067554c: 740b je 0x140675559
0x14067554e: 833802 cmp dword ptr [rax], 2
0x140675551: 7506 jne 0x140675559
0x140675553: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140675557: eb02 jmp 0x14067555b
0x140675559: 32c9 xor cl, cl
0x14067555b: 884b05 mov byte ptr [rbx + 5], cl
0x14067555e: bac56d5829 mov edx, 0x29586dc5
0x140675563: 488bcf mov rcx, rdi
0x140675566: e8358ea9ff call 0x14010e3a0
0x14067556b: 4885c0 test rax, rax
0x14067556e: 740b je 0x14067557b
0x140675570: 833802 cmp dword ptr [rax], 2
0x140675573: 7506 jne 0x14067557b
0x140675575: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140675579: eb02 jmp 0x14067557d
0x14067557b: 32c9 xor cl, cl
0x14067557d: 884b06 mov byte ptr [rbx + 6], cl
0x140675580: ba09050ee6 mov edx, 0xe60e0509
0x140675585: 488bcf mov rcx, rdi
0x140675588: e8138ea9ff call 0x14010e3a0
0x14067558d: 4885c0 test rax, rax
0x140675590: 740b je 0x14067559d
0x140675592: 833802 cmp dword ptr [rax], 2
0x140675595: 7506 jne 0x14067559d
0x140675597: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x14067559b: eb02 jmp 0x14067559f
0x14067559d: b101 mov cl, 1
0x14067559f: 884b07 mov byte ptr [rbx + 7], cl
0x1406755a2: baa1dcbe2c mov edx, 0x2cbedca1
0x1406755a7: 488bcf mov rcx, rdi
0x1406755aa: e8f18da9ff call 0x14010e3a0
0x1406755af: 4885c0 test rax, rax
0x1406755b2: 740b je 0x1406755bf
0x1406755b4: 833802 cmp dword ptr [rax], 2
0x1406755b7: 7506 jne 0x1406755bf
0x1406755b9: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x1406755bd: eb02 jmp 0x1406755c1
0x1406755bf: b101 mov cl, 1
0x1406755c1: 884b08 mov byte ptr [rbx + 8], cl
0x1406755c4: 443b74243c cmp r14d, dword ptr [rsp + 0x3c]
0x1406755c9: 730b jae 0x1406755d6
0x1406755cb: 488b442440 mov rax, qword ptr [rsp + 0x40]
0x1406755d0: 468b3cb8 mov r15d, dword ptr [rax + r15*4]
0x1406755d4: eb03 jmp 0x1406755d9
0x1406755d6: 4533ff xor r15d, r15d
0x1406755d9: ba37d1809f mov edx, 0x9f80d137
0x1406755de: 44897b0c mov dword ptr [rbx + 0xc], r15d
0x1406755e2: 488bcf mov rcx, rdi
0x1406755e5: e8b68da9ff call 0x14010e3a0
0x1406755ea: 4885c0 test rax, rax
0x1406755ed: 740c je 0x1406755fb
0x1406755ef: 833801 cmp dword ptr [rax], 1
0x1406755f2: 7507 jne 0x1406755fb
0x1406755f4: f30f104008 movss xmm0, dword ptr [rax + 8]
0x1406755f9: eb03 jmp 0x1406755fe
0x1406755fb: 0f57c0 xorps xmm0, xmm0
0x1406755fe: ba49d0809f mov edx, 0x9f80d049
0x140675603: f30f114310 movss dword ptr [rbx + 0x10], xmm0
0x140675608: e8938da9ff call 0x14010e3a0
0x14067560d: 4885c0 test rax, rax
0x140675610: 740c je 0x14067561e
0x140675612: 833801 cmp dword ptr [rax], 1
0x140675615: 7507 jne 0x14067561e
0x140675617: f30f104008 movss xmm0, dword ptr [rax + 8]
0x14067561c: eb03 jmp 0x140675621
0x14067561e: 0f57c0 xorps xmm0, xmm0
0x140675621: f30f114314 movss dword ptr [rbx + 0x14], xmm0
0x140675626: 664183ff04 cmp r15w, 4
0x14067562b: 7207 jb 0x140675634
0x14067562d: c7430c00000000 mov dword ptr [rbx + 0xc], 0
0x140675634: 4c8bcb mov r9, rbx
0x140675637: 4c8bc7 mov r8, rdi
0x14067563a: 498bd4 mov rdx, r12
0x14067563d: 488bce mov rcx, rsi
0x140675640: e8bb000000 call 0x140675700
0x140675645: 41ffc6 inc r14d
0x140675648: 48ba65210b59c84216b2 movabs rdx, 0xb21642c8590b2165
0x140675652: 41ba00000000 mov r10d, 0
0x140675658: 443b742454 cmp r14d, dword ptr [rsp + 0x54]
0x14067565d: 0f826dfcffff jb 0x1406752d0
0x140675663: 4c8bbc2430010000 mov r15, qword ptr [rsp + 0x130]
0x14067566b: 488b4c2430 mov rcx, qword ptr [rsp + 0x30]
0x140675670: 4c8bb42438010000 mov r14, qword ptr [rsp + 0x138]
0x140675678: 4c8bac2440010000 mov r13, qword ptr [rsp + 0x140]
0x140675680: 488bbc2448010000 mov rdi, qword ptr [rsp + 0x148]
0x140675688: 488b9c2480010000 mov rbx, qword ptr [rsp + 0x180]
0x140675690: 448954243c mov dword ptr [rsp + 0x3c], r10d
0x140675695: 4885c9 test rcx, rcx
0x140675698: 750c jne 0x1406756a6
0x14067569a: 488b4c2440 mov rcx, qword ptr [rsp + 0x40]
0x14067569f: e8984a3700 call 0x1409ea13c
0x1406756a4: eb0b jmp 0x1406756b1
0x1406756a6: 488b01 mov rax, qword ptr [rcx]
0x1406756a9: 488b542440 mov rdx, qword ptr [rsp + 0x40]
0x1406756ae: ff5020 call qword ptr [rax + 0x20]
0x1406756b1: 488b4c2448 mov rcx, qword ptr [rsp + 0x48]
0x1406756b6: 33c0 xor eax, eax
0x1406756b8: 4889442440 mov qword ptr [rsp + 0x40], rax
0x1406756bd: 89442438 mov dword ptr [rsp + 0x38], eax
0x1406756c1: 89442454 mov dword ptr [rsp + 0x54], eax
0x1406756c5: 4885c9 test rcx, rcx
0x1406756c8: 750c jne 0x1406756d6
0x1406756ca: 488b4c2458 mov rcx, qword ptr [rsp + 0x58]
0x1406756cf: e8684a3700 call 0x1409ea13c
0x1406756d4: eb0b jmp 0x1406756e1
0x1406756d6: 488b01 mov rax, qword ptr [rcx]
0x1406756d9: 488b542458 mov rdx, qword ptr [rsp + 0x58]
0x1406756de: ff5020 call qword ptr [rax + 0x20]
0x1406756e1: 488b4d20 mov rcx, qword ptr [rbp + 0x20]
0x1406756e5: 4833cc xor rcx, rsp
0x1406756e8: e873453700 call 0x1409e9c60
0x1406756ed: 4881c450010000 add rsp, 0x150
0x1406756f4: 415c pop r12
0x1406756f6: 5e pop rsi
0x1406756f7: 5d pop rbp
0x1406756f8: c3 ret 
0x1406756f9: cc int3 
0x1406756fa: cc int3 
0x1406756fb: cc int3 
0x1406756fc: cc int3 
0x1406756fd: cc int3 
0x1406756fe: cc int3 
0x1406756ff: cc int3 
0x140675700: 4885d2 test rdx, rdx
0x140675703: 0f84e8020000 je 0x1406759f1
0x140675709: 4c8bdc mov r11, rsp
0x14067570c: 53 push rbx
0x14067570d: 55 push rbp
0x14067570e: 57 push rdi
0x14067570f: 4881ec80000000 sub rsp, 0x80
0x140675716: 498bd8 mov rbx, r8
0x140675719: 498bf9 mov rdi, r9
0x14067571c: 488be9 mov rbp, rcx
0x14067571f: 4885db test rbx, rbx
0x140675722: 0f84bf020000 je 0x1406759e7
0x140675728: 49897308 mov qword ptr [r11 + 8], rsi
0x14067572c: 488d0555124600 lea rax, [rip + 0x461255]
0x140675733: 4d897318 mov qword ptr [r11 + 0x18], r14
0x140675737: 4d8d4b10 lea r9, [r11 + 0x10]
0x14067573b: 4d897b20 mov qword ptr [r11 + 0x20], r15
0x14067573f: baee78b092 mov edx, 0x92b078ee
0x140675744: 4533ff xor r15d, r15d
0x140675747: 0f29742470 movaps xmmword ptr [rsp + 0x70], xmm6
0x14067574c: 0f297c2460 movaps xmmword ptr [rsp + 0x60], xmm7
0x140675751: 488bcb mov rcx, rbx
0x140675754: 450f2943b8 movaps xmmword ptr [r11 - 0x48], xmm8
0x140675759: 4d897b98 mov qword ptr [r11 - 0x68], r15
0x14067575d: 458d4701 lea r8d, [r15 + 1]
0x140675761: 4d897ba0 mov qword ptr [r11 - 0x60], r15
0x140675765: 4d897ba8 mov qword ptr [r11 - 0x58], r15
0x140675769: 49894310 mov qword ptr [r11 + 0x10], rax