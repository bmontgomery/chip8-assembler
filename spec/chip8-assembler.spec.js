  describe('Chip 8 Assembler', function(){
  var assembler;

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
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('trims tabs from instruction', function(){
      assembler.processInput('\tCLS\t');
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('we\'re going to need comments', function() {
      assembler.processInput('CLS ; here is a comment');
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('processes mulitple lines of instructions', function(){
      assembler.processInput('CLS\nCLS');

      expect(assembler.output[0]).toBe(0x00E0);
      expect(assembler.output[1]).toBe(0x00E0);
    });

    it('is OK with blank lines', function(){
      assembler.processInput('CLS\n\nCLS');

      expect(assembler.output[0]).toBe(0x00E0);
      expect(assembler.output[1]).toBe(0x00E0);
    });

    it('is OK with comment-only lines', function(){
      assembler.processInput('; here is a comment\nCLS');

      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('is not case sensitive', function(){
      assembler.processInput('cls');
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('detects label', function(){
      assembler.processInput('MYLABEL: CLS ; clear screen');
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('replaces label with memory address', function(){
      var instructions = [
        'MYLABEL: CLS',
        '         JP    MYLABEL'
      ];
      assembler.processInput(instructions.join('\n'));
      expect(assembler.output[1]).toBe(0x1200);
    });

    it('replaces label with memory address which isn\'t yet defined', function(){
      var instructions = [
        '         JP    MYLABEL',
        'MYLABEL: CLS'
      ];
      assembler.processInput(instructions.join('\n'));
      expect(assembler.output[0]).toBe(0x1202);
    });
  });

  describe('specific instructions', function(){
    it('compiles CLS to 0x0E00', function(){
      assembler.processInput('CLS');
      expect(assembler.output[0]).toBe(0x00E0);
    });

    it('compiles SYS', function(){
      assembler.processInput('SYS #0400');
      expect(assembler.output[0]).toBe(0x0400);
    });

    it('compiles JP with address', function(){
      assembler.processInput('JP #0500');
      expect(assembler.output[0]).toBe(0x1500);
    });

    it('compiles JP with V0 and address', function(){
      assembler.processInput('JP V0, #0508');
      expect(assembler.output[0]).toBe(0xB508);
    });

    it('compiles CALL', function(){
      assembler.processInput('CALL #0220');
      expect(assembler.output[0]).toBe(0x2220);
    });

    it('compiles SE with V register and value', function(){
      assembler.processInput('SE V0, #A0');
      expect(assembler.output[0]).toBe(0x30A0);
    });

    it('compiles SE with 2 V registers', function(){
      assembler.processInput('SE V0, VE');
      expect(assembler.output[0]).toBe(0x50E0);
    });

    it('compiles SNE with V register and value', function(){
      assembler.processInput('SNE VA, #AA');
      expect(assembler.output[0]).toBe(0x4AAA);
    });

    it('compiles SNE with 2 V registers', function(){
      assembler.processInput('SNE VA, VB');
      expect(assembler.output[0]).toBe(0x9AB0);
    });

    it('compiles LD with V register and hex value', function(){
      assembler.processInput('LD V9, #42');
      expect(assembler.output[0]).toBe(0x6942);
    });

    it('compiles LD with V register and dec value', function(){
      assembler.processInput('LD V9, 42');
      expect(assembler.output[0]).toBe(0x6900 + 42);
    });

    it('compiles LD with 2 V registers', function(){
      assembler.processInput('LD V9, V2');
      expect(assembler.output[0]).toBe(0x8920);
    });

    it('compiles LD with I and address', function(){
      assembler.processInput('LD I, #51A');
      expect(assembler.output[0]).toBe(0xA51A);
    });

    it('compiles LD with V register and DT', function(){
      assembler.processInput('LD V2, DT');
      expect(assembler.output[0]).toBe(0xF207);
    });

    it('compiles LD with V register and K', function(){
      assembler.processInput('LD V2, K');
      expect(assembler.output[0]).toBe(0xF20A);
    });

    it('compiles LD with DT and V register', function(){
      assembler.processInput('LD DT, V8');
      expect(assembler.output[0]).toBe(0xF815);
    });

    it('compiles LD with ST and V register', function(){
      assembler.processInput('LD ST, V7');
      expect(assembler.output[0]).toBe(0xF718);
    });

    it('compiles LD with F and V register', function(){
      assembler.processInput('LD F, V6');
      expect(assembler.output[0]).toBe(0xF629);
    });

    it('compiles LD with B and V register', function(){
      assembler.processInput('LD B, V6');
      expect(assembler.output[0]).toBe(0xF633);
    });

    it('compiles LD with [I] and V register', function(){
      assembler.processInput('LD [I], V5');
      expect(assembler.output[0]).toBe(0xF555);
    });

    it('compiles LD with V register and [I]', function(){
      assembler.processInput('LD V2, [I]');
      expect(assembler.output[0]).toBe(0xF265);
    });

    it('compiles ADD with V register and value', function(){
      assembler.processInput('ADD V1, #09');
      expect(assembler.output[0]).toBe(0x7109);
    });

    it('compiles ADD with 2 V registers', function(){
      assembler.processInput('ADD V7, V8');
      expect(assembler.output[0]).toBe(0x8784);
    });

    it('compiles ADD with I and V register', function(){
      assembler.processInput('ADD I, V5');
      expect(assembler.output[0]).toBe(0xF51E);
    });

    it('compiles OR', function(){
      assembler.processInput('OR V1, V2');
      expect(assembler.output[0]).toBe(0x8121);
    });

    it('compiles AND', function(){
      assembler.processInput('AND V2, V3');
      expect(assembler.output[0]).toBe(0x8232);
    });

    it('compiles XOR', function(){
      assembler.processInput('XOR V4, VF');
      expect(assembler.output[0]).toBe(0x84F3);
    });

    it('compiles SUB', function(){
      assembler.processInput('SUB V4, V8');
      expect(assembler.output[0]).toBe(0x8485);
    });

    it('compiles SHR for 2 registers', function(){
      assembler.processInput('SHR V4, VB');
      expect(assembler.output[0]).toBe(0x84B6);
    });

    it('compiles SHR for 1 register', function(){
      assembler.processInput('SHR VC');
      expect(assembler.output[0]).toBe(0x8CC6);
    });

    it('compiles SUBN', function(){
      assembler.processInput('SUBN VC, VD');
      expect(assembler.output[0]).toBe(0x8CD7);
    });

    it('compiles SHL for 2 registers', function(){
      assembler.processInput('SHL V4, VB');
      expect(assembler.output[0]).toBe(0x84BE);
    });

    it('compiles SHL for 1 register', function(){
      assembler.processInput('SHL VC');
      expect(assembler.output[0]).toBe(0x8CCE);
    });

    it('compiles RND', function(){
      assembler.processInput('RND VD, #0F');
      expect(assembler.output[0]).toBe(0xCD0F);
    });

    it('compiles DRW', function(){
      assembler.processInput('DRW V0, V1, #A');
      expect(assembler.output[0]).toBe(0xD01A);
    });

    it('compiles SKP', function(){
      assembler.processInput('SKP VE');
      expect(assembler.output[0]).toBe(0xEE9E);
    });

    it('compiles SKNP', function(){
      assembler.processInput('SKNP V3');
      expect(assembler.output[0]).toBe(0xE3A1);
    });

    it('compiles DW', function(){
      assembler.processInput('DW #ABC2');
      expect(assembler.output[0]).toBe(0xABC2);
    });

    // it('compiles DB', function(){
    //   assembler.processInput('DB #FF\nDB #EA');
    //   expect(assembler.output[0]).toBe(0xFFEA);
    // });
  });

  it('compiles example program', function(){
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
      '       DW      #FFEA',
      '       DW      #21AC'
    ];

    var expectedOutput = [
      0x00E0,
      0xC0FF,
      0xA224,
      0xF033,
      0xF265,
      0xF029,
      0x6000,
      0x6300,
      0xD035,
      0xF129,
      0x6005,
      0xD035,
      0xF229,
      0x600A,
      0xD035,
      0xF00A,
      0x1200,
      0xFFEA,
      0x21AC
    ];
    assembler.processInput(instructions.join('\n'));
    expect(assembler.output).toEqual(expectedOutput);
  });
});