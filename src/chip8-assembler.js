(function(){
  window.Chip8Assembler = (function(){
    var tokenize, getVRegisterIndex, getValue, compileIndexIndexOpcode, compileIndexValueOpcode, compileIndexIndexOrValueOpcode, compileIndexOpcode;

    function Chip8Assembler() {
      this.reset();
    }

    Chip8Assembler.prototype.reset = function reset() {
      this.commands = [];
      this.labels = {};
      this.output = [];
    };

    Chip8Assembler.prototype.processInput = function processInput(input) {
      // Tokenize the file. This will result in an array of arrays. The top-level array
      // will contain one entry for each non-blank line in the file.
      var tokenizedLines = tokenize(input);
      this.parse(tokenizedLines);

      // now that the commands and labels are set up, the opcodes for each command can be generated.
      this.compileOpcodes();

      // generate the output
      var commandIndex;
      var currentCommand;
      for(commandIndex = 0; commandIndex < this.commands.length; commandIndex++) {
        currentCommand = this.commands[commandIndex];

        // each output is 1 byte in length, but most opcodes are 2 bytes in length, so
        // they need to be split

        // push the most significant byte to the output (only if there are 2 bytes in 
        // the opcode)
        if(currentCommand.bytes === 2) {
          this.output.push((currentCommand.opcode & 0xFF00) >> 8);
        }

        // push the least significant byte to the output
        this.output.push(currentCommand.opcode & 0x00FF);
      }
    };

    Chip8Assembler.prototype.parse = function(tokenizedLines) {
      var lineIndex;
      var currentLine;
      var command;
      var memoryPointer = 0x200;

      for(lineIndex = 0; lineIndex < tokenizedLines.length; lineIndex++) {
        currentLine = tokenizedLines[lineIndex];

        // build an object representing the current command
        command = {};

        // by default, commands take up 2 bytes.
        command.bytes = 2;

        // set the target memory location
        command.address = memoryPointer;

        // set the original arguments by copying the array
        command.args = currentLine.slice(0);

        // set the result arguments by copying the array
        command.resultArgs = currentLine.slice(0);

        // detect if there's a label
        if (currentLine[0].match(/:$/)) {
          // add this memory address to the labels collection, and point it to this command object
          this.labels[currentLine[0].replace(/:$/, '')] = command;

          // trim the label off of the result args
          command.resultArgs = command.resultArgs.slice(1);
        }

        // trim any commas out of the arguments
        var argIndex;
        for(argIndex = 0; argIndex < command.resultArgs.length; argIndex++) {
          command.resultArgs[argIndex] = command.resultArgs[argIndex].replace(/,$/, '');
        }

        // add this command to the main commands collection
        this.commands.push(command);

        memoryPointer += 2;
      }
    };

    Chip8Assembler.prototype.compileOpcodes = function() {
      var commandIndex;
      var currentCommand;
      var currentInstruction;
      var arg1;
      var arg2;

      for(commandIndex = 0; commandIndex < this.commands.length; commandIndex++) {
        currentCommand = this.commands[commandIndex];
        currentInstruction = currentCommand.resultArgs[0];

        switch(currentInstruction.toUpperCase()) {
          case 'CLS':
            currentCommand.opcode = 0x00E0;
            break;

          case 'RET':
            currentCommand.opcode = 0x00EE;
            break;

          case 'SYS':
            this.compileAddressOpcode(currentCommand, 0x0000);
            break;

          case 'JP':
            if (currentCommand.resultArgs.length === 2) {
              this.compileAddressOpcode(currentCommand, 0x1000);
            } else {
              this.compileAddressOpcode(currentCommand, 0xB000, 2);
            }
            break;

          case 'CALL':
            this.compileAddressOpcode(currentCommand, 0x2000);
            break;

          case 'SE':
            // the third argument will either be a literal value or a V register reference
            compileIndexIndexOrValueOpcode(currentCommand, 0x3000, 0x5000);
            break;

          case 'SNE':
            compileIndexIndexOrValueOpcode(currentCommand, 0x4000, 0x9000);
            break;

          case 'LD':
            arg1 = currentCommand.resultArgs[1].toUpperCase();
            arg2 = currentCommand.resultArgs[2].toUpperCase();

            if (arg1 === 'I') {
              this.compileAddressOpcode(currentCommand, 0xA000, 2);
            } else if (arg1 === 'DT') {
              compileIndexOpcode(currentCommand, 0xF015, 2);
            } else if (arg1 === 'ST') {
              compileIndexOpcode(currentCommand, 0xF018, 2);
            } else if (arg1 === 'F') {
              compileIndexOpcode(currentCommand, 0xF029, 2);
            } else if (arg1 === 'B') {
              compileIndexOpcode(currentCommand, 0xF033, 2);
            } else if (arg1 === '[I]') {
              compileIndexOpcode(currentCommand, 0xF055, 2);
            } else if (arg2 === 'DT') {
              compileIndexOpcode(currentCommand, 0xF007);
            } else if (arg2 === 'K') {
              compileIndexOpcode(currentCommand, 0xF00A);
            } else if (arg2 === '[I]') {
              compileIndexOpcode(currentCommand, 0xF065);
            } else {
              compileIndexIndexOrValueOpcode(currentCommand, 0x6000, 0x8000);
            }
            break;

          case 'ADD':
            if (currentCommand.resultArgs[1].toUpperCase() === 'I') {
              compileIndexOpcode(currentCommand, 0xF01E, 2);
            } else {
              compileIndexIndexOrValueOpcode(currentCommand, 0x7000, 0x8004);
            }
            break;

          case 'OR':
            compileIndexIndexOpcode(currentCommand, 0x8001);
            break;

          case 'AND':
            compileIndexIndexOpcode(currentCommand, 0x8002);
            break;

          case 'XOR':
            compileIndexIndexOpcode(currentCommand, 0x8003);
            break;

          case 'SUB':
            compileIndexIndexOpcode(currentCommand, 0x8005);
            break;

          case 'SHR':
            // if called with 2 args, one V register is referenced, meaning
            // use the same register for both X and Y arguments of resulting opcode
            if (currentCommand.resultArgs.length === 2) {
              currentCommand.resultArgs.push(currentCommand.resultArgs[1]);
            }

            compileIndexIndexOpcode(currentCommand, 0x8006);
            break;

          case 'SUBN':
            compileIndexIndexOpcode(currentCommand, 0x8007);
            break;

          case 'SHL':
            // if called with 2 args, one V register is referenced, meaning
            // use the same register for both X and Y arguments of resulting opcode
            if (currentCommand.resultArgs.length === 2) {
              currentCommand.resultArgs.push(currentCommand.resultArgs[1]);
            }

            compileIndexIndexOpcode(currentCommand, 0x800E);
            break;

          case 'RND':
            compileIndexValueOpcode(currentCommand, 0xC000);
            break;

          case 'DRW':
            // this is the only command with 4 args, so just use one of the helpers to
            // get the 2 referenced V registers...
            compileIndexIndexOpcode(currentCommand, 0xD000);

            // and combine it with the 4th argument to get the resulting opcode
            currentCommand.opcode |= getValue(currentCommand.resultArgs[3]);
            break;

          case 'SKP':
            compileIndexOpcode(currentCommand, 0xE09E);
            break;

          case 'SKNP':
            compileIndexOpcode(currentCommand, 0xE0A1);
            break;    

          case 'DB':
            // this is a literal byte to write to the chip8's memory
            var value = getValue(currentCommand.resultArgs[1]);

            // this command is only 1 byte long (as opposed to the usual 2 bytes)
            currentCommand.bytes = 1;

            // there really is no opcode, just the literal value written into the program
            currentCommand.opcode = value;
            break;

          case 'DW':
            // there really is no opcode, just the literal value written into the program
            currentCommand.opcode = getValue(currentCommand.args[1]);
            break;
        }  
      }
    };

    Chip8Assembler.prototype.getAddressFromArg = function(arg) {
      // if the arugment parses as an integer, then use that. Otherwise, treat 
      // is as a label and look it up in the labels collection and use the 
      // address to which that label corresponds.
      var result;

      result = getValue(arg);

      // if it's not a number, then assume it's a reference to a label
      if (isNaN(result)) {
        result = this.labels[arg].address;
      }

      // mask it to make sure it's a valid address (12 bits)
      result &= 0xFFF;

      return result;
    };

    Chip8Assembler.prototype.compileAddressOpcode = function(command, opcodeBase, argIndex) {
      // argIndex is optional, and used when the index of the argument which cointains the address 
      // or label is not 1
      // default argIndex to 1
      if (argIndex == undefined) {
        argIndex = 1;
      }

      var address = this.getAddressFromArg(command.resultArgs[argIndex]);
      command.opcode = opcodeBase | address;
    };

    compileIndexOpcode = function(command, opcodeBase, argIndex) {
      // argIndex is optional, and used when the index of the argument which cointains the address 
      // or label is not 1
      // default argIndex to 1
      if (argIndex == undefined) {
        argIndex = 1;
      }

      var vIndex = getVRegisterIndex(command.args[argIndex]);
      command.opcode = opcodeBase | (vIndex << 8);
    };

    compileIndexIndexOrValueOpcode = function(command, opcodeBaseValue, opcodeBaseIndex) {
      if (command.resultArgs[2].match(/^V/i)) {
        compileIndexIndexOpcode(command, opcodeBaseIndex);
      } else {
        // a value is the second argument
        compileIndexValueOpcode(command, opcodeBaseValue);
      }
    };

    compileIndexValueOpcode = function(command, opcodeBase) {
      // first arg is V register
      var vIndex = getVRegisterIndex(command.resultArgs[1]);

      // second arg is value
      var value = getValue(command.resultArgs[2]);

      command.opcode = opcodeBase | (vIndex << 8) | value;
    };

    compileIndexIndexOpcode = function(command, opcodeBase) {
      var vIndex1;
      var vIndex2;

      // a V register
      vIndex1 = getVRegisterIndex(command.resultArgs[1]);

      // the second argument will be a reference to a V register
      vIndex2 = getVRegisterIndex(command.resultArgs[2]);

      command.opcode = opcodeBase | (vIndex1 << 8) | (vIndex2 << 4);
    };

    tokenize = function(input) {
      // split the input into lines
      var inputLines = input.split('\n');
      var lineIndex;
      var currentLine;
      var args;
      var argIndex;
      var lineArgs;
      var result = [];

      // for each line in the file
      for(lineIndex = 0; lineIndex < inputLines.length; lineIndex++) {
        currentLine = inputLines[lineIndex];

        // take out comments
        args = currentLine.split(';')[0]

        // split on whitespace
        args = args.split(' ');

        // new line args array
        lineArgs = [];

        // build the lineArgs array by eliminating arguments which are blank
        for (argIndex = 0; argIndex < args.length; argIndex++) {
          // trim whitespace
          args[argIndex] = args[argIndex].trim();

          // if the arg isn't just whitespace, add to the line arguments array
          if (args[argIndex] !== '') {
            lineArgs.push(args[argIndex]);
          }
        }

        // add the lineArgs to the result array
        if (lineArgs.length) {
          result.push(lineArgs);
        }
      }

      // the tokenized array of arrays is returned
      return result;
    };

    getVRegisterIndex = function(arg) {
      return parseInt(arg[1], 16);
    };

    getValue = function(arg) {
      // if the value starts with #, then it's a hex value, otherwise, if it parses
      // to an integer with radix 10, then use that value.
      if (arg.match(/^#/)) {
        return parseInt(arg.slice(1), 16);
      } else {
        return parseInt(arg, 10);
      }
    };

    return Chip8Assembler;
  }());
}());