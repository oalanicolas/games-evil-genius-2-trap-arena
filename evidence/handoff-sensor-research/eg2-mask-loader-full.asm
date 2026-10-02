0x1406746a0: 4055 push rbp
0x1406746a2: 53 push rbx
0x1406746a3: 56 push rsi
0x1406746a4: 4155 push r13
0x1406746a6: 4157 push r15
0x1406746a8: 488d6c24e0 lea rbp, [rsp - 0x20]
0x1406746ad: 4881ec20010000 sub rsp, 0x120
0x1406746b4: 4533c0 xor r8d, r8d
0x1406746b7: ba03a28a82 mov edx, 0x828aa203
0x1406746bc: b9b586e294 mov ecx, 0x94e286b5
0x1406746c1: e8aab9a9ff call 0x140110070
0x1406746c6: 33f6 xor esi, esi
0x1406746c8: 894550 mov dword ptr [rbp + 0x50], eax
0x1406746cb: 393503cc6301 cmp dword ptr [rip + 0x163cc03], esi
0x1406746d1: 448be8 mov r13d, eax
0x1406746d4: 8bde mov ebx, esi
0x1406746d6: 7627 jbe 0x1406746ff
0x1406746d8: 0f1f840000000000 nop dword ptr [rax + rax]
0x1406746e0: 8bcb mov ecx, ebx
0x1406746e2: 4869c9c8000000 imul rcx, rcx, 0xc8
0x1406746e9: 48030de8cb6301 add rcx, qword ptr [rip + 0x163cbe8]
0x1406746f0: e8ebfeffff call 0x1406745e0
0x1406746f5: ffc3 inc ebx
0x1406746f7: 3b1dd7cb6301 cmp ebx, dword ptr [rip + 0x163cbd7]
0x1406746fd: 72e1 jb 0x1406746e0
0x1406746ff: 443b2dcacb6301 cmp r13d, dword ptr [rip + 0x163cbca]
0x140674706: 4889bc2460010000 mov qword ptr [rsp + 0x160], rdi
0x14067470e: 8935c0cb6301 mov dword ptr [rip + 0x163cbc0], esi
0x140674714: 0f86b2000000 jbe 0x1406747cc
0x14067471a: 488b0da7cb6301 mov rcx, qword ptr [rip + 0x163cba7]
0x140674721: 4885c9 test rcx, rcx
0x140674724: 750e jne 0x140674734
0x140674726: 4169cdc8000000 imul ecx, r13d, 0xc8
0x14067472d: e84e5a3700 call 0x1409ea180
0x140674732: eb0e jmp 0x140674742
0x140674734: 488b01 mov rax, qword ptr [rcx]
0x140674737: 458bc5 mov r8d, r13d
0x14067473a: bac8000000 mov edx, 0xc8
0x14067473f: ff5018 call qword ptr [rax + 0x18]
0x140674742: 488bf0 mov rsi, rax
0x140674745: 4885c0 test rax, rax
0x140674748: 0f847c000000 je 0x1406747ca
0x14067474e: 33ff xor edi, edi
0x140674750: 393d7ecb6301 cmp dword ptr [rip + 0x163cb7e], edi
0x140674756: 763d jbe 0x140674795
0x140674758: 0f1f840000000000 nop dword ptr [rax + rax]
0x140674760: 488b1571cb6301 mov rdx, qword ptr [rip + 0x163cb71]
0x140674767: 8bc7 mov eax, edi
0x140674769: 4869d8c8000000 imul rbx, rax, 0xc8
0x140674770: 4803d3 add rdx, rbx
0x140674773: 488d0c33 lea rcx, [rbx + rsi]
0x140674777: e854140000 call 0x140675bd0
0x14067477c: 488b0d55cb6301 mov rcx, qword ptr [rip + 0x163cb55]
0x140674783: 4803cb add rcx, rbx
0x140674786: e855feffff call 0x1406745e0
0x14067478b: ffc7 inc edi
0x14067478d: 3b3d41cb6301 cmp edi, dword ptr [rip + 0x163cb41]
0x140674793: 72cb jb 0x140674760
0x140674795: 488b0d2ccb6301 mov rcx, qword ptr [rip + 0x163cb2c]
0x14067479c: 4885c9 test rcx, rcx
0x14067479f: 750e jne 0x1406747af
0x1406747a1: 488b0d30cb6301 mov rcx, qword ptr [rip + 0x163cb30]
0x1406747a8: e88f593700 call 0x1409ea13c
0x1406747ad: eb0d jmp 0x1406747bc
0x1406747af: 488b01 mov rax, qword ptr [rcx]
0x1406747b2: 488b151fcb6301 mov rdx, qword ptr [rip + 0x163cb1f]
0x1406747b9: ff5020 call qword ptr [rax + 0x20]
0x1406747bc: 48893515cb6301 mov qword ptr [rip + 0x163cb15], rsi
0x1406747c3: 44892d06cb6301 mov dword ptr [rip + 0x163cb06], r13d
0x1406747ca: 33f6 xor esi, esi
0x1406747cc: 448bfe mov r15d, esi
0x1406747cf: 4585ed test r13d, r13d
0x1406747d2: 0f8480020000 je 0x140674a58
0x1406747d8: 4c89a42418010000 mov qword ptr [rsp + 0x118], r12
0x1406747e0: 4c89b42410010000 mov qword ptr [rsp + 0x110], r14
0x1406747e8: 0f1f840000000000 nop dword ptr [rax + rax]
0x1406747f0: 458bcf mov r9d, r15d
0x1406747f3: 4533c0 xor r8d, r8d
0x1406747f6: ba03a28a82 mov edx, 0x828aa203
0x1406747fb: b9b586e294 mov ecx, 0x94e286b5
0x140674800: e8dbb9a9ff call 0x1401101e0
0x140674805: 48894558 mov qword ptr [rbp + 0x58], rax
0x140674809: 4885c0 test rax, rax
0x14067480c: 0f842a020000 je 0x140674a3c
0x140674812: 448b30 mov r14d, dword ptr [rax]
0x140674815: 488bde mov rbx, rsi
0x140674818: bab586e294 mov edx, 0x94e286b5
0x14067481d: 48895c2438 mov qword ptr [rsp + 0x38], rbx
0x140674822: 8bfe mov edi, esi
0x140674824: c7442420b586e294 mov dword ptr [rsp + 0x20], 0x94e286b5
0x14067482c: 4889742430 mov qword ptr [rsp + 0x30], rsi
0x140674831: c7442424b586e294 mov dword ptr [rsp + 0x24], 0x94e286b5
0x140674839: e8f2bea9ff call 0x140110730
0x14067483e: 4889442428 mov qword ptr [rsp + 0x28], rax
0x140674843: 488bf0 mov rsi, rax
0x140674846: 4885c0 test rax, rax
0x140674849: 741e je 0x140674869
0x14067484b: b918000000 mov ecx, 0x18
0x140674850: e8ef583700 call 0x1409ea144
0x140674855: 488d5630 lea rdx, [rsi + 0x30]
0x140674859: 488bc8 mov rcx, rax
0x14067485c: e8bf95a4ff call 0x1400bde20
0x140674861: 488bd8 mov rbx, rax
0x140674864: 4889442438 mov qword ptr [rsp + 0x38], rax
0x140674869: 4533ed xor r13d, r13d
0x14067486c: 458d6501 lea r12d, [r13 + 1]
0x140674870: 4885db test rbx, rbx
0x140674873: 7409 je 0x14067487e
0x140674875: 4c396b08 cmp qword ptr [rbx + 8], r13
0x140674879: 0f94c0 sete al
0x14067487c: eb03 jmp 0x140674881
0x14067487e: 418bc4 mov eax, r12d
0x140674881: 84c0 test al, al
0x140674883: 7533 jne 0x1406748b8
0x140674885: 4885db test rbx, rbx
0x140674888: 7406 je 0x140674890
0x14067488a: 488b4308 mov rax, qword ptr [rbx + 8]
0x14067488e: eb03 jmp 0x140674893
0x140674890: 498bc5 mov rax, r13
0x140674893: 8b4804 mov ecx, dword ptr [rax + 4]
0x140674896: 85c9 test ecx, ecx
0x140674898: 740d je 0x1406748a7
0x14067489a: 4c396808 cmp qword ptr [rax + 8], r13
0x14067489e: 7407 je 0x1406748a7
0x1406748a0: 413bce cmp ecx, r14d
0x1406748a3: 7502 jne 0x1406748a7
0x1406748a5: ffc7 inc edi
0x1406748a7: 488d4c2420 lea rcx, [rsp + 0x20]
0x1406748ac: e8afc0a9ff call 0x140110960
0x1406748b1: 488b5c2438 mov rbx, qword ptr [rsp + 0x38]
0x1406748b6: ebb8 jmp 0x140674870
0x1406748b8: 488b442430 mov rax, qword ptr [rsp + 0x30]
0x1406748bd: 4c8b6558 mov r12, qword ptr [rbp + 0x58]
0x1406748c1: 448b6d50 mov r13d, dword ptr [rbp + 0x50]
0x1406748c5: 4885c0 test rax, rax
0x1406748c8: 741b je 0x1406748e5
0x1406748ca: 488b00 mov rax, qword ptr [rax]
0x1406748cd: ba18000000 mov edx, 0x18
0x1406748d2: f0ff481c lock dec dword ptr [rax + 0x1c]
0x1406748d6: 488b4c2430 mov rcx, qword ptr [rsp + 0x30]
0x1406748db: e85c583700 call 0x1409ea13c
0x1406748e0: 488b5c2438 mov rbx, qword ptr [rsp + 0x38]
0x1406748e5: 4885db test rbx, rbx
0x1406748e8: 7416 je 0x140674900
0x1406748ea: 488b03 mov rax, qword ptr [rbx]
0x1406748ed: ba18000000 mov edx, 0x18
0x1406748f2: f0ff481c lock dec dword ptr [rax + 0x1c]
0x1406748f6: 488b4c2438 mov rcx, qword ptr [rsp + 0x38]
0x1406748fb: e83c583700 call 0x1409ea13c
0x140674900: 33f6 xor esi, esi
0x140674902: 85ff test edi, edi
0x140674904: 0f8532010000 jne 0x140674a3c
0x14067490a: 418b0424 mov eax, dword ptr [r12]
0x14067490e: 0f57c0 xorps xmm0, xmm0
0x140674911: 8b0dbdc96301 mov ecx, dword ptr [rip + 0x163c9bd]
0x140674917: 89442440 mov dword ptr [rsp + 0x40], eax
0x14067491b: 8b05afc96301 mov eax, dword ptr [rip + 0x163c9af]
0x140674921: 48c744244401000100 mov qword ptr [rsp + 0x44], 0x10001
0x14067492a: 408874244c mov byte ptr [rsp + 0x4c], sil
0x14067492f: 4889742450 mov qword ptr [rsp + 0x50], rsi
0x140674934: 4889742458 mov qword ptr [rsp + 0x58], rsi
0x140674939: 4889742460 mov qword ptr [rsp + 0x60], rsi
0x14067493e: 4889742478 mov qword ptr [rsp + 0x78], rsi
0x140674943: 48897580 mov qword ptr [rbp - 0x80], rsi
0x140674947: 40887588 mov byte ptr [rbp - 0x78], sil
0x14067494b: 4889758c mov qword ptr [rbp - 0x74], rsi
0x14067494f: 40887594 mov byte ptr [rbp - 0x6c], sil
0x140674953: c745980000803f mov dword ptr [rbp - 0x68], 0x3f800000
0x14067495a: c7459cffffffff mov dword ptr [rbp - 0x64], 0xffffffff
0x140674961: 66c745a00001 mov word ptr [rbp - 0x60], 0x100
0x140674967: 488975a8 mov qword ptr [rbp - 0x58], rsi
0x14067496b: 488975b0 mov qword ptr [rbp - 0x50], rsi
0x14067496f: 8975b8 mov dword ptr [rbp - 0x48], esi
0x140674972: c745bccdcccc3d mov dword ptr [rbp - 0x44], 0x3dcccccd
0x140674979: 48c745c00000803f mov qword ptr [rbp - 0x40], 0x3f800000
0x140674981: 48c745c800000001 mov qword ptr [rbp - 0x38], 0x1000000
0x140674989: 66c745d00001 mov word ptr [rbp - 0x30], 0x100
0x14067498f: 8975d4 mov dword ptr [rbp - 0x2c], esi
0x140674992: 668975d8 mov word ptr [rbp - 0x28], si
0x140674996: 48c745f008000000 mov qword ptr [rbp - 0x10], 8
0x14067499e: 488975f8 mov qword ptr [rbp - 8], rsi
0x1406749a2: f30f7f442468 movdqu xmmword ptr [rsp + 0x68], xmm0
0x1406749a8: 897500 mov dword ptr [rbp], esi
0x1406749ab: f30f7f45e0 movdqu xmmword ptr [rbp - 0x20], xmm0
0x1406749b0: 3bc8 cmp ecx, eax
0x1406749b2: 7369 jae 0x140674a1d
0x1406749b4: 4869d9c8000000 imul rbx, rcx, 0xc8
0x1406749bb: 8d4101 lea eax, [rcx + 1]
0x1406749be: 48031d13c96301 add rbx, qword ptr [rip + 0x163c913]
0x1406749c5: 488d542440 lea rdx, [rsp + 0x40]
0x1406749ca: 488bcb mov rcx, rbx
0x1406749cd: 890501c96301 mov dword ptr [rip + 0x163c901], eax
0x1406749d3: e8f8110000 call 0x140675bd0
0x1406749d8: 4885db test rbx, rbx
0x1406749db: 743a je 0x140674a17
0x1406749dd: 482b1df4c86301 sub rbx, qword ptr [rip + 0x163c8f4]
0x1406749e4: 48b80bd7a3703d0ad7a3 movabs rax, 0xa3d70a3d70a3d70b
0x1406749ee: 48f7eb imul rbx
0x1406749f1: 4803d3 add rdx, rbx
0x1406749f4: 8bde mov ebx, esi
0x1406749f6: 48c1fa07 sar rdx, 7
0x1406749fa: 488bc2 mov rax, rdx
0x1406749fd: 48c1e83f shr rax, 0x3f
0x140674a01: 4803d0 add rdx, rax
0x140674a04: 8b05cac86301 mov eax, dword ptr [rip + 0x163c8ca]
0x140674a0a: 480f45da cmovne rbx, rdx
0x140674a0e: 483bd8 cmp rbx, rax
0x140674a11: 480f43d8 cmovae rbx, rax
0x140674a15: eb08 jmp 0x140674a1f
0x140674a17: 8b05b3c86301 mov eax, dword ptr [rip + 0x163c8b3]
0x140674a1d: 8bd8 mov ebx, eax
0x140674a1f: 488d4c2440 lea rcx, [rsp + 0x40]
0x140674a24: e8b7fbffff call 0x1406745e0
0x140674a29: 4869cbc8000000 imul rcx, rbx, 0xc8
0x140674a30: 48030da1c86301 add rcx, qword ptr [rip + 0x163c8a1]
0x140674a37: e8f4000000 call 0x140674b30
0x140674a3c: 41ffc7 inc r15d
0x140674a3f: 453bfd cmp r15d, r13d
0x140674a42: 0f82a8fdffff jb 0x1406747f0
0x140674a48: 4c8bb42410010000 mov r14, qword ptr [rsp + 0x110]
0x140674a50: 4c8ba42418010000 mov r12, qword ptr [rsp + 0x118]
0x140674a58: 488bbc2460010000 mov rdi, qword ptr [rsp + 0x160]
0x140674a60: 4881c420010000 add rsp, 0x120
0x140674a67: 415f pop r15
0x140674a69: 415d pop r13
0x140674a6b: 5e pop rsi
0x140674a6c: 5b pop rbx
0x140674a6d: 5d pop rbp
0x140674a6e: c3 ret 
0x140674a6f: cc int3 
0x140674a70: 48895c2408 mov qword ptr [rsp + 8], rbx
0x140674a75: 4889742410 mov qword ptr [rsp + 0x10], rsi
0x140674a7a: 48897c2418 mov qword ptr [rsp + 0x18], rdi
0x140674a7f: 458b11 mov r10d, dword ptr [r9]
0x140674a82: 488bf2 mov rsi, rdx
0x140674a85: 443b155cca3a01 cmp r10d, dword ptr [rip + 0x13aca5c]
0x140674a8c: 4c8bd9 mov r11, rcx
0x140674a8f: 7518 jne 0x140674aa9
0x140674a91: 8b0555ca3a01 mov eax, dword ptr [rip + 0x13aca55]
0x140674a97: 41394104 cmp dword ptr [r9 + 4], eax
0x140674a9b: 750c jne 0x140674aa9
0x140674a9d: 8b054dca3a01 mov eax, dword ptr [rip + 0x13aca4d]
0x140674aa3: 41394108 cmp dword ptr [r9 + 8], eax
0x140674aa7: 7464 je 0x140674b0d
0x140674aa9: 0fb7510a movzx edx, word ptr [rcx + 0xa]
0x140674aad: 418b5804 mov ebx, dword ptr [r8 + 4]
0x140674ab1: f7da neg edx
0x140674ab3: 418b38 mov edi, dword ptr [r8]
0x140674ab6: 8bc7 mov eax, edi
0x140674ab8: 440fb74108 movzx r8d, word ptr [rcx + 8]
0x140674abd: 0fafc2 imul eax, edx
0x140674ac0: 41f7d8 neg r8d
0x140674ac3: 418bc8 mov ecx, r8d
0x140674ac6: 440fafc7 imul r8d, edi
0x140674aca: 0fafcb imul ecx, ebx
0x140674acd: 2bc8 sub ecx, eax
0x140674acf: 8bc3 mov eax, ebx
0x140674ad1: 2b0e sub ecx, dword ptr [rsi]
0x140674ad3: 0fafc2 imul eax, edx
0x140674ad6: 4403d1 add r10d, ecx
0x140674ad9: 418b4908 mov ecx, dword ptr [r9 + 8]
0x140674add: 2bc8 sub ecx, eax
0x140674adf: 418bc2 mov eax, r10d
0x140674ae2: 412bc8 sub ecx, r8d
0x140674ae5: 0fafc3 imul eax, ebx
0x140674ae8: 2b4e08 sub ecx, dword ptr [rsi + 8]
0x140674aeb: 8bd1 mov edx, ecx
0x140674aed: 0fafd7 imul edx, edi
0x140674af0: 2bd0 sub edx, eax
0x140674af2: 7819 js 0x140674b0d
0x140674af4: 410fb74304 movzx eax, word ptr [r11 + 4]
0x140674af9: 0fafcb imul ecx, ebx
0x140674afc: 440fafd7 imul r10d, edi
0x140674b00: 4103ca add ecx, r10d
0x140674b03: 0fafc8 imul ecx, eax
0x140674b06: 8d0411 lea eax, [rcx + rdx]
0x140674b09: 85c9 test ecx, ecx
0x140674b0b: 7905 jns 0x140674b12
0x140674b0d: b8ffffffff mov eax, 0xffffffff
0x140674b12: 488b5c2408 mov rbx, qword ptr [rsp + 8]
0x140674b17: 488b742410 mov rsi, qword ptr [rsp + 0x10]
0x140674b1c: 488b7c2418 mov rdi, qword ptr [rsp + 0x18]
0x140674b21: c3 ret 
0x140674b22: cc int3 
0x140674b23: cc int3 
0x140674b24: cc int3 
0x140674b25: cc int3 
0x140674b26: cc int3 
0x140674b27: cc int3 
0x140674b28: cc int3 
0x140674b29: cc int3 
0x140674b2a: cc int3 
0x140674b2b: cc int3 
0x140674b2c: cc int3 
0x140674b2d: cc int3 
0x140674b2e: cc int3 
0x140674b2f: cc int3 
0x140674b30: 4055 push rbp
0x140674b32: 53 push rbx
0x140674b33: 57 push rdi
0x140674b34: 488bec mov rbp, rsp
0x140674b37: 4883ec70 sub rsp, 0x70
0x140674b3b: 8b39 mov edi, dword ptr [rcx]
0x140674b3d: 488bd9 mov rbx, rcx
0x140674b40: 85ff test edi, edi
0x140674b42: 0f8416060000 je 0x14067515e
0x140674b48: bab586e294 mov edx, 0x94e286b5
0x140674b4d: e8debba9ff call 0x140110730
0x140674b52: 4885c0 test rax, rax
0x140674b55: 0f8403060000 je 0x14067515e
0x140674b5b: 8bd7 mov edx, edi
0x140674b5d: 488bc8 mov rcx, rax
0x140674b60: e84bbfa9ff call 0x140110ab0
0x140674b65: 488bf8 mov rdi, rax
0x140674b68: 4885c0 test rax, rax
0x140674b6b: 0f84ed050000 je 0x14067515e
0x140674b71: 4889b42498000000 mov qword ptr [rsp + 0x98], rsi
0x140674b79: bad85796ce mov edx, 0xce9657d8
0x140674b7e: 4c89a424a0000000 mov qword ptr [rsp + 0xa0], r12
0x140674b86: 488bc8 mov rcx, rax
0x140674b89: 4c89ac24a8000000 mov qword ptr [rsp + 0xa8], r13
0x140674b91: 4c89742468 mov qword ptr [rsp + 0x68], r14
0x140674b96: 4c897c2460 mov qword ptr [rsp + 0x60], r15
0x140674b9b: 0f29742450 movaps xmmword ptr [rsp + 0x50], xmm6
0x140674ba0: 0f297c2440 movaps xmmword ptr [rsp + 0x40], xmm7
0x140674ba5: e8f697a9ff call 0x14010e3a0
0x140674baa: be01000000 mov esi, 1
0x140674baf: 4885c0 test rax, rax
0x140674bb2: 740b je 0x140674bbf
0x140674bb4: 833800 cmp dword ptr [rax], 0
0x140674bb7: 7506 jne 0x140674bbf
0x140674bb9: 448b7008 mov r14d, dword ptr [rax + 8]
0x140674bbd: eb03 jmp 0x140674bc2
0x140674bbf: 448bf6 mov r14d, esi
0x140674bc2: ba14533bf1 mov edx, 0xf13b5314
0x140674bc7: 6644897304 mov word ptr [rbx + 4], r14w
0x140674bcc: e8cf97a9ff call 0x14010e3a0
0x140674bd1: 4885c0 test rax, rax
0x140674bd4: 7408 je 0x140674bde
0x140674bd6: 833800 cmp dword ptr [rax], 0
0x140674bd9: 7503 jne 0x140674bde
0x140674bdb: 8b7008 mov esi, dword ptr [rax + 8]
0x140674bde: ba26afe1c3 mov edx, 0xc3e1af26
0x140674be3: 66897306 mov word ptr [rbx + 6], si
0x140674be7: e8b497a9ff call 0x14010e3a0
0x140674bec: 33f6 xor esi, esi
0x140674bee: 4885c0 test rax, rax
0x140674bf1: 7409 je 0x140674bfc
0x140674bf3: 3930 cmp dword ptr [rax], esi
0x140674bf5: 7505 jne 0x140674bfc
0x140674bf7: 8b5008 mov edx, dword ptr [rax + 8]
0x140674bfa: eb02 jmp 0x140674bfe
0x140674bfc: 8bd6 mov edx, esi
0x140674bfe: 664585f6 test r14w, r14w
0x140674c02: 7413 je 0x140674c17
0x140674c04: 0fb7c2 movzx eax, dx
0x140674c07: 33d2 xor edx, edx
0x140674c09: 410fb7ce movzx ecx, r14w
0x140674c0d: f7f1 div ecx
0x140674c0f: 66895308 mov word ptr [rbx + 8], dx
0x140674c13: 6689430a mov word ptr [rbx + 0xa], ax
0x140674c17: babc189256 mov edx, 0x569218bc
0x140674c1c: 488bcf mov rcx, rdi
0x140674c1f: e87c97a9ff call 0x14010e3a0
0x140674c24: 0f57ff xorps xmm7, xmm7
0x140674c27: 4885c0 test rax, rax
0x140674c2a: 740c je 0x140674c38
0x140674c2c: 833801 cmp dword ptr [rax], 1
0x140674c2f: 7507 jne 0x140674c38
0x140674c31: f30f104008 movss xmm0, dword ptr [rax + 8]
0x140674c36: eb03 jmp 0x140674c3b
0x140674c38: 0f57c0 xorps xmm0, xmm0
0x140674c3b: ba69a0aaca mov edx, 0xcaaaa069
0x140674c40: f30f114310 movss dword ptr [rbx + 0x10], xmm0
0x140674c45: e85697a9ff call 0x14010e3a0
0x140674c4a: 4885c0 test rax, rax
0x140674c4d: 7409 je 0x140674c58
0x140674c4f: 3930 cmp dword ptr [rax], esi
0x140674c51: 7505 jne 0x140674c58
0x140674c53: 8b4808 mov ecx, dword ptr [rax + 8]
0x140674c56: eb02 jmp 0x140674c5a
0x140674c58: 8bce mov ecx, esi
0x140674c5a: 894b50 mov dword ptr [rbx + 0x50], ecx
0x140674c5d: ba5985bf1c mov edx, 0x1cbf8559
0x140674c62: 488bcf mov rcx, rdi
0x140674c65: e83697a9ff call 0x14010e3a0
0x140674c6a: 4885c0 test rax, rax
0x140674c6d: 740b je 0x140674c7a
0x140674c6f: 833802 cmp dword ptr [rax], 2
0x140674c72: 7506 jne 0x140674c7a
0x140674c74: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674c78: eb02 jmp 0x140674c7c
0x140674c7a: 32c9 xor cl, cl
0x140674c7c: 884b54 mov byte ptr [rbx + 0x54], cl
0x140674c7f: baafc674ca mov edx, 0xca74c6af
0x140674c84: 488bcf mov rcx, rdi
0x140674c87: e81497a9ff call 0x14010e3a0
0x140674c8c: f30f103590654d00 movss xmm6, dword ptr [rip + 0x4d6590]
0x140674c94: 4885c0 test rax, rax
0x140674c97: 740c je 0x140674ca5
0x140674c99: 833801 cmp dword ptr [rax], 1
0x140674c9c: 7507 jne 0x140674ca5
0x140674c9e: f30f104008 movss xmm0, dword ptr [rax + 8]
0x140674ca3: eb03 jmp 0x140674ca8
0x140674ca5: 0f28c6 movaps xmm0, xmm6
0x140674ca8: bad4dbb8dd mov edx, 0xddb8dbd4
0x140674cad: f30f114358 movss dword ptr [rbx + 0x58], xmm0
0x140674cb2: e8e996a9ff call 0x14010e3a0
0x140674cb7: 4885c0 test rax, rax
0x140674cba: 7409 je 0x140674cc5
0x140674cbc: 3930 cmp dword ptr [rax], esi
0x140674cbe: 7505 jne 0x140674cc5
0x140674cc0: 8b4808 mov ecx, dword ptr [rax + 8]
0x140674cc3: eb05 jmp 0x140674cca
0x140674cc5: b9ffffffff mov ecx, 0xffffffff
0x140674cca: 894b5c mov dword ptr [rbx + 0x5c], ecx
0x140674ccd: bafbb53c68 mov edx, 0x683cb5fb
0x140674cd2: 488bcf mov rcx, rdi
0x140674cd5: e8c696a9ff call 0x14010e3a0
0x140674cda: 4885c0 test rax, rax
0x140674cdd: 740b je 0x140674cea
0x140674cdf: 833802 cmp dword ptr [rax], 2
0x140674ce2: 7506 jne 0x140674cea
0x140674ce4: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674ce8: eb02 jmp 0x140674cec
0x140674cea: 32c9 xor cl, cl
0x140674cec: 884b60 mov byte ptr [rbx + 0x60], cl
0x140674cef: ba42c87949 mov edx, 0x4979c842
0x140674cf4: 488bcf mov rcx, rdi
0x140674cf7: e8a496a9ff call 0x14010e3a0
0x140674cfc: 4885c0 test rax, rax
0x140674cff: 740b je 0x140674d0c
0x140674d01: 833802 cmp dword ptr [rax], 2
0x140674d04: 7506 jne 0x140674d0c
0x140674d06: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674d0a: eb02 jmp 0x140674d0e
0x140674d0c: b101 mov cl, 1
0x140674d0e: 884b61 mov byte ptr [rbx + 0x61], cl
0x140674d11: bad16fa3f2 mov edx, 0xf2a36fd1
0x140674d16: 488bcf mov rcx, rdi
0x140674d19: e88296a9ff call 0x14010e3a0
0x140674d1e: 4885c0 test rax, rax
0x140674d21: 7409 je 0x140674d2c
0x140674d23: 3930 cmp dword ptr [rax], esi
0x140674d25: 7505 jne 0x140674d2c
0x140674d27: 8b4808 mov ecx, dword ptr [rax + 8]
0x140674d2a: eb02 jmp 0x140674d2e
0x140674d2c: 8bce mov ecx, esi
0x140674d2e: 894b14 mov dword ptr [rbx + 0x14], ecx
0x140674d31: 488bd7 mov rdx, rdi
0x140674d34: 488bcb mov rcx, rbx
0x140674d37: e834040000 call 0x140675170
0x140674d3c: 4c8d2d451c4600 lea r13, [rip + 0x461c45]
0x140674d43: ba857281e6 mov edx, 0xe6817285
0x140674d48: 4c8d4d20 lea r9, [rbp + 0x20]
0x140674d4c: 4c896d20 mov qword ptr [rbp + 0x20], r13
0x140674d50: 41b802000000 mov r8d, 2
0x140674d56: 4c8d7330 lea r14, [rbx + 0x30]
0x140674d5a: 488bcf mov rcx, rdi
0x140674d5d: e83ea9a9ff call 0x14010f6a0
0x140674d62: 85c0 test eax, eax
0x140674d64: 7430 je 0x140674d96
0x140674d66: 8bd0 mov edx, eax
0x140674d68: 498bce mov rcx, r14
0x140674d6b: e850b9a4ff call 0x1400c06c0
0x140674d70: 488d05192d4700 lea rax, [rip + 0x472d19]
0x140674d77: 4c8975c8 mov qword ptr [rbp - 0x38], r14
0x140674d7b: 4c8d4dc0 lea r9, [rbp - 0x40]
0x140674d7f: 488945c0 mov qword ptr [rbp - 0x40], rax
0x140674d83: ba857281e6 mov edx, 0xe6817285
0x140674d88: 41b802000000 mov r8d, 2
0x140674d8e: 488bcf mov rcx, rdi
0x140674d91: e80aa9a9ff call 0x14010f6a0
0x140674d96: ba2b0d4bb5 mov edx, 0xb54b0d2b
0x140674d9b: 488bcf mov rcx, rdi
0x140674d9e: e8fd95a9ff call 0x14010e3a0
0x140674da3: 4885c0 test rax, rax
0x140674da6: 740b je 0x140674db3
0x140674da8: 833802 cmp dword ptr [rax], 2
0x140674dab: 7506 jne 0x140674db3
0x140674dad: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674db1: eb02 jmp 0x140674db5
0x140674db3: 32c9 xor cl, cl
0x140674db5: 884b48 mov byte ptr [rbx + 0x48], cl
0x140674db8: ba6477b5aa mov edx, 0xaab57764
0x140674dbd: 488bcf mov rcx, rdi
0x140674dc0: e8db95a9ff call 0x14010e3a0
0x140674dc5: 4885c0 test rax, rax
0x140674dc8: 740a je 0x140674dd4
0x140674dca: 833803 cmp dword ptr [rax], 3
0x140674dcd: 7505 jne 0x140674dd4
0x140674dcf: 8b4808 mov ecx, dword ptr [rax + 8]
0x140674dd2: eb02 jmp 0x140674dd6
0x140674dd4: 8bce mov ecx, esi
0x140674dd6: 894b4c mov dword ptr [rbx + 0x4c], ecx
0x140674dd9: 4c8d4d20 lea r9, [rbp + 0x20]
0x140674ddd: 488bcf mov rcx, rdi
0x140674de0: 4c896d20 mov qword ptr [rbp + 0x20], r13
0x140674de4: ba5ce11eb1 mov edx, 0xb11ee15c
0x140674de9: 4c8d7b68 lea r15, [rbx + 0x68]
0x140674ded: 41b802000000 mov r8d, 2
0x140674df3: e8a8a8a9ff call 0x14010f6a0
0x140674df8: 4c8d2541fb4900 lea r12, [rip + 0x49fb41]
0x140674dff: 85c0 test eax, eax
0x140674e01: 7429 je 0x140674e2c
0x140674e03: 8bd0 mov edx, eax
0x140674e05: 498bcf mov rcx, r15
0x140674e08: e883f4a3ff call 0x1400b4290
0x140674e0d: 4c8d4dc0 lea r9, [rbp - 0x40]
0x140674e11: 4c8965c0 mov qword ptr [rbp - 0x40], r12
0x140674e15: ba5ce11eb1 mov edx, 0xb11ee15c
0x140674e1a: 4c897dc8 mov qword ptr [rbp - 0x38], r15
0x140674e1e: 41b802000000 mov r8d, 2
0x140674e24: 488bcf mov rcx, rdi
0x140674e27: e874a8a9ff call 0x14010f6a0
0x140674e2c: 418b570c mov edx, dword ptr [r15 + 0xc]
0x140674e30: 448bf6 mov r14d, esi
0x140674e33: 85d2 test edx, edx
0x140674e35: 744b je 0x140674e82
0x140674e37: 660f1f840000000000 nop word ptr [rax + rax]
0x140674e40: 498b07 mov rax, qword ptr [r15]
0x140674e43: 418bce mov ecx, r14d
0x140674e46: 393488 cmp dword ptr [rax + rcx*4], esi
0x140674e49: 488d0c88 lea rcx, [rax + rcx*4]
0x140674e4d: 752b jne 0x140674e7a
0x140674e4f: 443bf2 cmp r14d, edx
0x140674e52: 732e jae 0x140674e82
0x140674e54: 8bc2 mov eax, edx
0x140674e56: 412bc6 sub eax, r14d
0x140674e59: 83e801 sub eax, 1
0x140674e5c: 7414 je 0x140674e72
0x140674e5e: 448bc0 mov r8d, eax
0x140674e61: 488d5104 lea rdx, [rcx + 4]
0x140674e65: 49c1e002 shl r8, 2
0x140674e69: e8d89c3d00 call 0x140a4eb46
0x140674e6e: 418b570c mov edx, dword ptr [r15 + 0xc]
0x140674e72: ffca dec edx
0x140674e74: 4189570c mov dword ptr [r15 + 0xc], edx
0x140674e78: eb03 jmp 0x140674e7d
0x140674e7a: 41ffc6 inc r14d
0x140674e7d: 443bf2 cmp r14d, edx
0x140674e80: 72be jb 0x140674e40
0x140674e82: baa33c123e mov edx, 0x3e123ca3
0x140674e87: 488bcf mov rcx, rdi
0x140674e8a: e81195a9ff call 0x14010e3a0
0x140674e8f: 4c8b7c2460 mov r15, qword ptr [rsp + 0x60]
0x140674e94: 4c8b742468 mov r14, qword ptr [rsp + 0x68]
0x140674e99: 4885c0 test rax, rax
0x140674e9c: 740a je 0x140674ea8
0x140674e9e: 833803 cmp dword ptr [rax], 3
0x140674ea1: 7505 jne 0x140674ea8
0x140674ea3: 8b4808 mov ecx, dword ptr [rax + 8]
0x140674ea6: eb02 jmp 0x140674eaa
0x140674ea8: 8bce mov ecx, esi
0x140674eaa: 894b78 mov dword ptr [rbx + 0x78], ecx
0x140674ead: ba7dbd018d mov edx, 0x8d01bd7d
0x140674eb2: 488bcf mov rcx, rdi
0x140674eb5: e8e694a9ff call 0x14010e3a0
0x140674eba: 4885c0 test rax, rax
0x140674ebd: 740c je 0x140674ecb
0x140674ebf: 833801 cmp dword ptr [rax], 1
0x140674ec2: 7507 jne 0x140674ecb
0x140674ec4: f30f104008 movss xmm0, dword ptr [rax + 8]
0x140674ec9: eb08 jmp 0x140674ed3
0x140674ecb: f30f100551614d00 movss xmm0, dword ptr [rip + 0x4d6151]
0x140674ed3: ba8fbc018d mov edx, 0x8d01bc8f
0x140674ed8: f30f11437c movss dword ptr [rbx + 0x7c], xmm0
0x140674edd: e8be94a9ff call 0x14010e3a0
0x140674ee2: 4885c0 test rax, rax
0x140674ee5: 740a je 0x140674ef1
0x140674ee7: 833801 cmp dword ptr [rax], 1
0x140674eea: 7505 jne 0x140674ef1
0x140674eec: f30f107008 movss xmm6, dword ptr [rax + 8]
0x140674ef1: f30f5ff7 maxss xmm6, xmm7
0x140674ef5: ba3d1cce22 mov edx, 0x22ce1c3d
0x140674efa: f30f5fc7 maxss xmm0, xmm7
0x140674efe: f30f5d352a664d00 minss xmm6, dword ptr [rip + 0x4d662a]
0x140674f06: f30f5dc6 minss xmm0, xmm6
0x140674f0a: f30f11b380000000 movss dword ptr [rbx + 0x80], xmm6
0x140674f12: f30f11437c movss dword ptr [rbx + 0x7c], xmm0
0x140674f17: e88494a9ff call 0x14010e3a0
0x140674f1c: 0f28742450 movaps xmm6, xmmword ptr [rsp + 0x50]
0x140674f21: 4885c0 test rax, rax
0x140674f24: 740c je 0x140674f32
0x140674f26: 833801 cmp dword ptr [rax], 1
0x140674f29: 7507 jne 0x140674f32
0x140674f2b: f30f104008 movss xmm0, dword ptr [rax + 8]
0x140674f30: eb03 jmp 0x140674f35
0x140674f32: 0f28c7 movaps xmm0, xmm7
0x140674f35: baea762167 mov edx, 0x672176ea
0x140674f3a: f30f118394000000 movss dword ptr [rbx + 0x94], xmm0
0x140674f42: e85994a9ff call 0x14010e3a0
0x140674f47: 4885c0 test rax, rax
0x140674f4a: 740c je 0x140674f58
0x140674f4c: 833801 cmp dword ptr [rax], 1
0x140674f4f: 7507 jne 0x140674f58
0x140674f51: f30f104008 movss xmm0, dword ptr [rax + 8]
0x140674f56: eb03 jmp 0x140674f5b
0x140674f58: 0f28c7 movaps xmm0, xmm7
0x140674f5b: ba474f118c mov edx, 0x8c114f47
0x140674f60: f30f118384000000 movss dword ptr [rbx + 0x84], xmm0
0x140674f68: e83394a9ff call 0x14010e3a0
0x140674f6d: 4885c0 test rax, rax
0x140674f70: 740b je 0x140674f7d
0x140674f72: 833802 cmp dword ptr [rax], 2
0x140674f75: 7506 jne 0x140674f7d
0x140674f77: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674f7b: eb02 jmp 0x140674f7f
0x140674f7d: 32c9 xor cl, cl
0x140674f7f: 888b88000000 mov byte ptr [rbx + 0x88], cl
0x140674f85: baff9d7563 mov edx, 0x63759dff
0x140674f8a: 488bcf mov rcx, rdi
0x140674f8d: e80e94a9ff call 0x14010e3a0
0x140674f92: 4885c0 test rax, rax
0x140674f95: 740b je 0x140674fa2
0x140674f97: 833802 cmp dword ptr [rax], 2
0x140674f9a: 7506 jne 0x140674fa2
0x140674f9c: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674fa0: eb02 jmp 0x140674fa4
0x140674fa2: 32c9 xor cl, cl
0x140674fa4: 888b89000000 mov byte ptr [rbx + 0x89], cl
0x140674faa: ba25c5b383 mov edx, 0x83b3c525
0x140674faf: 488bcf mov rcx, rdi
0x140674fb2: e8e993a9ff call 0x14010e3a0
0x140674fb7: 4885c0 test rax, rax
0x140674fba: 740b je 0x140674fc7
0x140674fbc: 833802 cmp dword ptr [rax], 2
0x140674fbf: 7506 jne 0x140674fc7
0x140674fc1: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674fc5: eb02 jmp 0x140674fc9
0x140674fc7: 32c9 xor cl, cl
0x140674fc9: 888b8a000000 mov byte ptr [rbx + 0x8a], cl
0x140674fcf: bac0106a0b mov edx, 0xb6a10c0
0x140674fd4: 488bcf mov rcx, rdi
0x140674fd7: e8c493a9ff call 0x14010e3a0
0x140674fdc: 4885c0 test rax, rax
0x140674fdf: 740b je 0x140674fec
0x140674fe1: 833802 cmp dword ptr [rax], 2
0x140674fe4: 7506 jne 0x140674fec
0x140674fe6: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140674fea: eb02 jmp 0x140674fee
0x140674fec: b101 mov cl, 1
0x140674fee: 888b8b000000 mov byte ptr [rbx + 0x8b], cl
0x140674ff4: baaf38dea1 mov edx, 0xa1de38af
0x140674ff9: 488bcf mov rcx, rdi
0x140674ffc: e89f93a9ff call 0x14010e3a0
0x140675001: 4885c0 test rax, rax
0x140675004: 740a je 0x140675010
0x140675006: 833801 cmp dword ptr [rax], 1
0x140675009: 7505 jne 0x140675010
0x14067500b: f30f107808 movss xmm7, dword ptr [rax + 8]
0x140675010: ba8eab781b mov edx, 0x1b78ab8e
0x140675015: f30f11bb8c000000 movss dword ptr [rbx + 0x8c], xmm7
0x14067501d: e87e93a9ff call 0x14010e3a0
0x140675022: 0f287c2440 movaps xmm7, xmmword ptr [rsp + 0x40]
0x140675027: 4885c0 test rax, rax
0x14067502a: 740b je 0x140675037
0x14067502c: 833802 cmp dword ptr [rax], 2
0x14067502f: 7506 jne 0x140675037
0x140675031: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x140675035: eb02 jmp 0x140675039
0x140675037: b101 mov cl, 1
0x140675039: 888b90000000 mov byte ptr [rbx + 0x90], cl
0x14067503f: ba2c09dfc3 mov edx, 0xc3df092c
0x140675044: 488bcf mov rcx, rdi
0x140675047: e85493a9ff call 0x14010e3a0
0x14067504c: 4885c0 test rax, rax
0x14067504f: 740b je 0x14067505c
0x140675051: 833802 cmp dword ptr [rax], 2
0x140675054: 7506 jne 0x14067505c
0x140675056: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x14067505a: eb02 jmp 0x14067505e
0x14067505c: b101 mov cl, 1
0x14067505e: 888b91000000 mov byte ptr [rbx + 0x91], cl
0x140675064: bac0e056f7 mov edx, 0xf756e0c0
0x140675069: 488bcf mov rcx, rdi
0x14067506c: e82f93a9ff call 0x14010e3a0
0x140675071: 4885c0 test rax, rax
0x140675074: 740b je 0x140675081
0x140675076: 833802 cmp dword ptr [rax], 2
0x140675079: 7506 jne 0x140675081
0x14067507b: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x14067507f: eb02 jmp 0x140675083
0x140675081: 32c9 xor cl, cl
0x140675083: 888b98000000 mov byte ptr [rbx + 0x98], cl
0x140675089: 4c8d4d20 lea r9, [rbp + 0x20]
0x14067508d: 488bcf mov rcx, rdi
0x140675090: 488975b0 mov qword ptr [rbp - 0x50], rsi
0x140675094: ba01c38a77 mov edx, 0x778ac301
0x140675099: 488975b8 mov qword ptr [rbp - 0x48], rsi
0x14067509d: 41b802000000 mov r8d, 2
0x1406750a3: 4c896d20 mov qword ptr [rbp + 0x20], r13
0x1406750a7: e8f4a5a9ff call 0x14010f6a0
0x1406750ac: 4c8bac24a8000000 mov r13, qword ptr [rsp + 0xa8]
0x1406750b4: 85c0 test eax, eax
0x1406750b6: 742e je 0x1406750e6
0x1406750b8: 8bd0 mov edx, eax
0x1406750ba: 488d4db0 lea rcx, [rbp - 0x50]
0x1406750be: e8cdf1a3ff call 0x1400b4290
0x1406750c3: 488d45b0 lea rax, [rbp - 0x50]
0x1406750c7: 4c8965c0 mov qword ptr [rbp - 0x40], r12
0x1406750cb: 4c8d4dc0 lea r9, [rbp - 0x40]
0x1406750cf: 488945c8 mov qword ptr [rbp - 0x38], rax
0x1406750d3: ba01c38a77 mov edx, 0x778ac301
0x1406750d8: 41b802000000 mov r8d, 2
0x1406750de: 488bcf mov rcx, rdi
0x1406750e1: e8baa5a9ff call 0x14010f6a0
0x1406750e6: 448b45bc mov r8d, dword ptr [rbp - 0x44]
0x1406750ea: 4c8ba424a0000000 mov r12, qword ptr [rsp + 0xa0]
0x1406750f2: 4585c0 test r8d, r8d
0x1406750f5: 7430 je 0x140675127
0x1406750f7: 660f1f840000000000 nop word ptr [rax + rax]
0x140675100: 488b45b0 mov rax, qword ptr [rbp - 0x50]
0x140675104: 8bce mov ecx, esi
0x140675106: 833c8800 cmp dword ptr [rax + rcx*4], 0
0x14067510a: 488d1488 lea rdx, [rax + rcx*4]
0x14067510e: 7410 je 0x140675120
0x140675110: 488d8ba0000000 lea rcx, [rbx + 0xa0]
0x140675117: e8e4caa6ff call 0x1400e1c00
0x14067511c: 448b45bc mov r8d, dword ptr [rbp - 0x44]
0x140675120: ffc6 inc esi
0x140675122: 413bf0 cmp esi, r8d
0x140675125: 72d9 jb 0x140675100
0x140675127: ba743f6526 mov edx, 0x26653f74
0x14067512c: 488bcf mov rcx, rdi
0x14067512f: e86c92a9ff call 0x14010e3a0
0x140675134: 488bb42498000000 mov rsi, qword ptr [rsp + 0x98]
0x14067513c: 4885c0 test rax, rax
0x14067513f: 740b je 0x14067514c
0x140675141: 833802 cmp dword ptr [rax], 2
0x140675144: 7506 jne 0x14067514c
0x140675146: 0fb64808 movzx ecx, byte ptr [rax + 8]
0x14067514a: eb02 jmp 0x14067514e
0x14067514c: 32c9 xor cl, cl
0x14067514e: 888b99000000 mov byte ptr [rbx + 0x99], cl
0x140675154: 488b4db0 mov rcx, qword ptr [rbp - 0x50]
0x140675158: ff15c2563f00 call qword ptr [rip + 0x3f56c2]
0x14067515e: 4883c470 add rsp, 0x70
0x140675162: 5f pop rdi
0x140675163: 5b pop rbx
0x140675164: 5d pop rbp
0x140675165: c3 ret 
0x140675166: cc int3 
0x140675167: cc int3 
0x140675168: cc int3 
0x140675169: cc int3 
0x14067516a: cc int3 
0x14067516b: cc int3 
0x14067516c: cc int3 
0x14067516d: cc int3 
0x14067516e: cc int3 
0x14067516f: cc int3 
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