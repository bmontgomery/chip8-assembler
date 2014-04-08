  describe('Chip 8 Assembler', function(){
  var assembler;

  var get2Bytes = function(startIndex) {
    if (startIndex == undefined) {
      startIndex = 0;
    }

    return (assembler.output[startIndex] << 8) | assembler.output[startIndex + 1];
  };

  beforeEach(function(){
    assembler = new Chip8Assembler();
  });

  it('is a thing', function(){
    expect(Chip8Assembler).not.toBeUndefined();
  });

  it('accepts input', function(){
    assembler.processInput('code goes here');
  });

  describe('instruction processing', function(){
    it('trims whitespace from instruction', function(){
      assembler.processInput('  CLS  ');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('trims tabs from instruction', function(){
      assembler.processInput('\tCLS\t');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('we\'re going to need comments', function() {
      assembler.processInput('CLS ; here is a comment');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('processes mulitple lines of instructions', function(){
      assembler.processInput('CLS\nCLS');

      expect(get2Bytes()).toBe(0x00E0);
      expect(get2Bytes(2)).toBe(0x00E0);
    });

    it('is OK with blank lines', function(){
      assembler.processInput('CLS\n\nCLS');

      expect(get2Bytes()).toBe(0x00E0);
      expect(get2Bytes(2)).toBe(0x00E0);
    });

    it('is OK with comment-only lines', function(){
      assembler.processInput('; here is a comment\nCLS');

      expect(get2Bytes()).toBe(0x00E0);
    });

    it('is not case sensitive', function(){
      assembler.processInput('cls');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('detects label', function(){
      assembler.processInput('MYLABEL: CLS ; clear screen');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('replaces label with memory address', function(){
      var instructions = [
        'MYLABEL: CLS',
        '         JP    MYLABEL'
      ];
      assembler.processInput(instructions.join('\n'));
      expect(get2Bytes(2)).toBe(0x1200);
    });

    it('replaces label with memory address (more comlexity)', function(){
      var instructions = [
        '     CLS',
        '     CLS',
        '     CLS',
        'LBL: CLS',
        '     CLS',
        '     CLS',
        '     CLS',
        '     JP   LBL'
      ];
      assembler.processInput(instructions.join('\n'));
      expect(get2Bytes(14)).toBe(0x1206);
    });

    it('replaces label with memory address which isn\'t yet defined', function(){
      var instructions = [
        '         JP    MYLABEL',
        'MYLABEL: CLS'
      ];
      assembler.processInput(instructions.join('\n'));
      expect(get2Bytes()).toBe(0x1202);
    });
  });

  describe('specific instructions', function(){
    it('compiles CLS', function(){
      assembler.processInput('CLS');
      expect(get2Bytes()).toBe(0x00E0);
    });

    it('compiles RET', function(){
      assembler.processInput('RET');
      expect(get2Bytes()).toBe(0x00EE);
    });

    it('compiles SYS', function(){
      assembler.processInput('SYS #0400');
      expect(get2Bytes()).toBe(0x0400);
    });

    it('compiles JP with address', function(){
      assembler.processInput('JP #0500');
      expect(get2Bytes()).toBe(0x1500);
    });

    it('compiles JP with V0 and address', function(){
      assembler.processInput('JP V0, #0508');
      expect(get2Bytes()).toBe(0xB508);
    });

    it('compiles CALL', function(){
      assembler.processInput('CALL #0220');
      expect(get2Bytes()).toBe(0x2220);
    });

    it('compiles SE with V register and value', function(){
      assembler.processInput('SE V0, #A0');
      expect(get2Bytes()).toBe(0x30A0);
    });

    it('compiles SE with 2 V registers', function(){
      assembler.processInput('SE V0, VE');
      expect(get2Bytes()).toBe(0x50E0);
    });

    it('compiles SNE with V register and value', function(){
      assembler.processInput('SNE VA, #AA');
      expect(get2Bytes()).toBe(0x4AAA);
    });

    it('compiles SNE with 2 V registers', function(){
      assembler.processInput('SNE VA, VB');
      expect(get2Bytes()).toBe(0x9AB0);
    });

    it('compiles LD with V register and hex value', function(){
      assembler.processInput('LD V9, #42');
      expect(get2Bytes()).toBe(0x6942);
    });

    it('compiles LD with V register and dec value', function(){
      assembler.processInput('LD V9, 42');
      expect(get2Bytes()).toBe(0x6900 + 42);
    });

    it('compiles LD with 2 V registers', function(){
      assembler.processInput('LD V9, V2');
      expect(get2Bytes()).toBe(0x8920);
    });

    it('compiles LD with I and address', function(){
      assembler.processInput('LD I, #51A');
      expect(get2Bytes()).toBe(0xA51A);
    });

    it('compiles LD with V register and DT', function(){
      assembler.processInput('LD V2, DT');
      expect(get2Bytes()).toBe(0xF207);
    });

    it('compiles LD with V register and K', function(){
      assembler.processInput('LD V2, K');
      expect(get2Bytes()).toBe(0xF20A);
    });

    it('compiles LD with DT and V register', function(){
      assembler.processInput('LD DT, V8');
      expect(get2Bytes()).toBe(0xF815);
    });

    it('compiles LD with ST and V register', function(){
      assembler.processInput('LD ST, V7');
      expect(get2Bytes()).toBe(0xF718);
    });

    it('compiles LD with F and V register', function(){
      assembler.processInput('LD F, V6');
      expect(get2Bytes()).toBe(0xF629);
    });

    it('compiles LD with B and V register', function(){
      assembler.processInput('LD B, V6');
      expect(get2Bytes()).toBe(0xF633);
    });

    it('compiles LD with [I] and V register', function(){
      assembler.processInput('LD [I], V5');
      expect(get2Bytes()).toBe(0xF555);
    });

    it('compiles LD with V register and [I]', function(){
      assembler.processInput('LD V2, [I]');
      expect(get2Bytes()).toBe(0xF265);
    });

    it('compiles ADD with V register and value', function(){
      assembler.processInput('ADD V1, #09');
      expect(get2Bytes()).toBe(0x7109);
    });

    it('compiles ADD with 2 V registers', function(){
      assembler.processInput('ADD V7, V8');
      expect(get2Bytes()).toBe(0x8784);
    });

    it('compiles ADD with I and V register', function(){
      assembler.processInput('ADD I, V5');
      expect(get2Bytes()).toBe(0xF51E);
    });

    it('compiles OR', function(){
      assembler.processInput('OR V1, V2');
      expect(get2Bytes()).toBe(0x8121);
    });

    it('compiles AND', function(){
      assembler.processInput('AND V2, V3');
      expect(get2Bytes()).toBe(0x8232);
    });

    it('compiles XOR', function(){
      assembler.processInput('XOR V4, VF');
      expect(get2Bytes()).toBe(0x84F3);
    });

    it('compiles SUB', function(){
      assembler.processInput('SUB V4, V8');
      expect(get2Bytes()).toBe(0x8485);
    });

    it('compiles SHR for 2 registers', function(){
      assembler.processInput('SHR V4, VB');
      expect(get2Bytes()).toBe(0x84B6);
    });

    it('compiles SHR for 1 register', function(){
      assembler.processInput('SHR VC');
      expect(get2Bytes()).toBe(0x8CC6);
    });

    it('compiles SUBN', function(){
      assembler.processInput('SUBN VC, VD');
      expect(get2Bytes()).toBe(0x8CD7);
    });

    it('compiles SHL for 2 registers', function(){
      assembler.processInput('SHL V4, VB');
      expect(get2Bytes()).toBe(0x84BE);
    });

    it('compiles SHL for 1 register', function(){
      assembler.processInput('SHL VC');
      expect(get2Bytes()).toBe(0x8CCE);
    });

    it('compiles RND', function(){
      assembler.processInput('RND VD, #0F');
      expect(get2Bytes()).toBe(0xCD0F);
    });

    it('compiles DRW', function(){
      assembler.processInput('DRW V0, V1, #A');
      expect(get2Bytes()).toBe(0xD01A);
    });

    it('compiles SKP', function(){
      assembler.processInput('SKP VE');
      expect(get2Bytes()).toBe(0xEE9E);
    });

    it('compiles SKNP', function(){
      assembler.processInput('SKNP V3');
      expect(get2Bytes()).toBe(0xE3A1);
    });

    it('compiles DW', function(){
      assembler.processInput('DW #ABC2');
      expect(get2Bytes()).toBe(0xABC2);
    });

    it('compiles DB - once', function(){
      assembler.processInput('DB #FC');
      expect(assembler.output[0]).toBe(0xFC);
    });

    it('compiles DB - twice', function(){
      assembler.processInput('DB #FF\nDB #EA');
      expect(get2Bytes()).toBe(0xFFEA);
    });
  });

  it('compiles example program from chasm manual', function(){
    var instructions = [
      'START: CLS',
      '       RND     V0,   #FF',
      '       LD      I,    #224',
      '       LD      B,    V0',
      '       LD      V2,   [I]',
      '       LD      F,    V0',
      '       LD      V0,   #00',
      '       LD      V3,   #00',
      '       DRW     V0,   V3,   5',
      '       LD      F,    V1',
      '       LD      V0,   #05',
      '       DRW     V0,   V3,   5',
      '       LD      F,    V2',
      '       LD      V0,   10',
      '       DRW     V0,   V3,   5',
      '       LD      V0,   K',
      '       JP      START',
      '',
      '       DB      #FF',
      '       DB      #EA',
      '',
      '       DW      #21AC'
    ];

    var expectedOutput = [
      0x00, 0xE0,
      0xC0, 0xFF,
      0xA2, 0x24,
      0xF0, 0x33,
      0xF2, 0x65,
      0xF0, 0x29,
      0x60, 0x00,
      0x63, 0x00,
      0xD0, 0x35,
      0xF1, 0x29,
      0x60, 0x05,
      0xD0, 0x35,
      0xF2, 0x29,
      0x60, 0x0A,
      0xD0, 0x35,
      0xF0, 0x0A,
      0x12, 0x00,
      0xFF, 0xEA,
      0x21, 0xAC
    ];
    assembler.processInput(instructions.join('\n'));
    expect(assembler.output).toEqual(expectedOutput);
  });

  it('compiles example program for displaying characters', function(){
    var instructions = [
      '           LD   V0,      0     ; set V0 (the character to display)',
      '           LD   V1,      1     ; set x (V1) to 1 (the x coord of sprite)',
      '           LD   V2,      1     ; set y (V2) to 1 (the y coord of sprite)',
      '           LD   V4,      57    ; set x_max (V4) to 57 - this is the maximum x value at which a sprite will be displayed',

      'CHECKEXIT: SNE  V0,      #10   ; if V0 is #10, jump to end; otherwise skip next instruction',
      '           JP   #FFF           ; exit',
      '           CALL DISPCHAR       ; call subroutine to display character',
      '           JP   CHECKEXIT      ; when subroutine returns, go back to if statement to check to see if program should exit',

      'DISPCHAR:  LD   F,       V0    ; set I to the start address of the character in V0',
      '           DRW  V1,      V2, 5 ; draw sprite 5 bytes in size at coords x, y (V1, V2)',
      '           ADD  V0,      1     ; increment char to display (V0) by 1',
      '           ADD  V1,      5     ; increment x (V1) by 5',

      '; if x > x_max, increment y by 6 and set x to 0',
      '           LD,  V3,      V1    ; copy value from x (V1) to V3',
      '           SUB, V3,      V4    ; subtract x_max (V4) from V3',
      '           SE   VF,      0     ; skip next instruction if result was positive (VF = 0)',
      '           JP   NEG            ; jump to negative case',
      '           JP   RET            ; jump to return from subroutine',

      '  NEG:     LD   V1,      1     ; set x (V1) to 1',
      '           ADD  V2,      6     ; increment y (V2) by 6',

      '  RET:     RET                 ; return from subroutine'
    ];

    var expectedOutput = [
        0x60, 0x00,
        0x61, 0x01,
        0x62, 0x01,
        0x64, 0x39,
        0x40, 0x10,
        0x1F, 0xFF,
        0x22, 0x10,
        0x12, 0x08,
        0xF0, 0x29,
        0xD1, 0x25,
        0x70, 0x01,
        0x71, 0x05,
        0x83, 0x10,
        0x83, 0x45,
        0x3F, 0x00,
        0x12, 0x22,
        0x12, 0x26,
        0x61, 0x01,
        0x72, 0x06,
        0x00, 0xEE 
    ];
    assembler.processInput(instructions.join('\n'));
    expect(assembler.output).toEqual(expectedOutput);
  });
});