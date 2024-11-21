[
  "var"
  "fun"
  "init"
  "block"
  "allocations"
  "unreachable"
  "struct"
  "bid"
] @keyword

[
  "default"
  "undef"
  "unit"
] @constant.builtin

[
  (ast_integer)
  (ast_float)
  (constant)
] @constant

(struct_member) @property
(block bid: (block_id) @function)

(phi_node) @variable.parameter
(load "load" @function.builtin)
(store "store" @function.builtin)
(call "call" @function.builtin)
(typecast "typecast" @function.builtin
          "to" @keyword)
(unary_op (unary_operator) @function.builtin) 
(arith_op (arith_operator) @function.builtin)
(shift_op (shift_operator) @function.builtin)
(cmp_op "cmp" @function.builtin
        (cmp_operator) @function.builtin)
(bitwise_op (bitwise_operator) @function.builtin)
(gep_op "getelementptr" @function.builtin
        "offset" @keyword)
(nop) @function.builtin

(jump "j" @function.builtin
      (block_id) @function)
(conditional_branch "br" @function.builtin)
(switch_branch "switch" @function.builtin)
(return "ret" @function.builtin)

[
  "="
] @operator

(type) @type
(type "unit" @type)
(array_type "x" @operator)
(const_type "const" @keyword)
(pointer_type "*" @operator
              "const" @keyword)
(function_type "ret" @keyword
               "params" @keyword)
(struct_type "struct" @type)

(function_signature name: (at_identifier) @function)

[
  ":"
  ","
] @operator.delimiter

[
  "("
  ")"
  "[" 
  "]"
  "{"
  "}"
] @punctuation.bracket


