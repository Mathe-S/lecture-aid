import CryptoJS from "crypto-js";

interface UserData {
  id: string;
  email: string;
  name: string;
}

// Generate a unique encrypted progress key for each user based on their progress
export function generateEncryptedProgressKey(
  userData: UserData,
  completedSteps: number
): string {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const progressData = {
    userId: userData.id,
    email: userData.email,
    name: userData.name,
    completedSteps,
    challengeId: "course-overview",
    date: timestamp,
  };

  const dataString = JSON.stringify(progressData);
  const secretKey = `course-overview-${userData.id}-${timestamp}`;

  // Encrypt the progress data
  const encrypted = CryptoJS.AES.encrypt(dataString, secretKey).toString();

  // Create a shorter, more readable key by taking parts of the encrypted string
  const shortKey =
    encrypted.substring(0, 16) +
    "-" +
    encrypted.substring(encrypted.length - 16) +
    "-" +
    completedSteps.toString().padStart(2, "0");

  return shortKey.toUpperCase();
}

// Verify if an encrypted key is valid (for future use)
export function verifyProgressKey(
  key: string,
  userData: UserData,
  expectedSteps: number
): boolean {
  try {
    const generatedKey = generateEncryptedProgressKey(userData, expectedSteps);
    return key === generatedKey;
  } catch {
    return false;
  }
}

// Import question types
import type { Question } from "@/components/challenges/course-overview/InteractiveQuestion";

// Get step content and validation logic
export function getStepContent(stepId: string) {
  const stepContents: Record<string, any> = {
    "static-checking": {
      title: "Static Checking",
      description:
        "Understanding static analysis and type checking in software construction.",
      content: `
        <h3>Static Checking Overview</h3>
        <p>Static checking is a method of analyzing code without executing it. It helps catch errors early in the development process.</p>
        
        <h4>Key Concepts:</h4>
        <ul>
          <li><strong>Type Checking:</strong> Ensures variables are used consistently with their declared types</li>
          <li><strong>Syntax Analysis:</strong> Verifies code follows language grammar rules</li>
          <li><strong>Dead Code Detection:</strong> Identifies unreachable or unused code</li>
          <li><strong>Style Checking:</strong> Enforces coding standards and conventions</li>
        </ul>

        <h4>Real-World Scenario:</h4>
        <p>You're reviewing a TypeScript codebase and need to identify potential static checking issues.</p>
      `,
      question: {
        type: "click-code",
        question: "Click on the line that contains a type error:",
        codeLines: [
          "function calculateArea(width: string, height: number): number {",
          "    return width * height;",
          "}",
          "",
          'let result = calculateArea("10", 5);',
          "console.log(result);",
        ],
        correctLines: [1],
        explanation:
          "Line 2 has a type error: multiplying a string by a number. The width parameter should be of type number.",
      } as Question,
    },

    testing: {
      title: "Testing",
      description:
        "Comprehensive testing strategies and methodologies for robust software.",
      content: `
        <h3>Software Testing Fundamentals</h3>
        <p>Testing is crucial for ensuring software reliability and correctness.</p>
        
        <h4>Testing Types:</h4>
        <ul>
          <li><strong>Unit Testing:</strong> Testing individual components in isolation</li>
          <li><strong>Integration Testing:</strong> Testing component interactions</li>
          <li><strong>System Testing:</strong> Testing the complete system</li>
          <li><strong>Acceptance Testing:</strong> Validating user requirements</li>
        </ul>

        <h4>Test-Driven Development (TDD):</h4>
        <ol>
          <li>Write a failing test</li>
          <li>Write minimal code to pass</li>
          <li>Refactor while keeping tests green</li>
        </ol>
      `,
      question: {
        type: "sequence-order",
        question: "Arrange the TDD process steps in the correct order:",
        items: [
          "Refactor the code while keeping tests green",
          "Write a failing test first",
          "Write minimal code to make the test pass",
          "Run the test to see it fail",
          "Run the test to see it pass",
        ],
        correctOrder: [1, 3, 2, 4, 0],
        explanation:
          "TDD follows Red-Green-Refactor: Write failing test → See it fail → Write minimal code → See it pass → Refactor",
      } as Question,
    },

    "code-review": {
      title: "Code Review",
      description: "Best practices for effective code review processes.",
      content: `
        <h3>Code Review Excellence</h3>
        <p>Code review is a systematic examination of code to find bugs, improve quality, and share knowledge.</p>
        
        <h4>Review Checklist:</h4>
        <ul>
          <li><strong>Functionality:</strong> Does the code do what it's supposed to do?</li>
          <li><strong>Readability:</strong> Is the code easy to understand?</li>
          <li><strong>Performance:</strong> Are there any obvious performance issues?</li>
          <li><strong>Security:</strong> Are there potential security vulnerabilities?</li>
          <li><strong>Testing:</strong> Is the code adequately tested?</li>
        </ul>

        <h4>Review Scenario:</h4>
        <p>You're reviewing this user authentication function and need to identify security issues:</p>
      `,
      question: {
        type: "click-code",
        question: "Click on the lines that contain security vulnerabilities:",
        codeLines: [
          "function authenticateUser(username, password) {",
          "    let users = getUsers();",
          "    for (let i = 0; i < users.length; i++) {",
          "        if (users[i].username == username && users[i].password == password) {",
          "            return true;",
          "        }",
          "    }",
          "    return false;",
          "}",
        ],
        correctLines: [3],
        multiSelect: false,
        explanation:
          "Line 4 has multiple security issues: plain text password comparison (should be hashed), loose equality (==) instead of strict (===), and no input validation for null/undefined values.",
      } as Question,
    },

    specifications: {
      title: "Specifications",
      description:
        "Writing clear and precise specifications for software components.",
      content: `
        <h3>Software Specifications</h3>
        <p>Specifications define what a program should do, not how it should do it.</p>
        
        <h4>Key Elements:</h4>
        <ul>
          <li><strong>Preconditions:</strong> What must be true when the method is called</li>
          <li><strong>Postconditions:</strong> What the method guarantees upon return</li>
          <li><strong>Effects:</strong> How the method changes the state of objects</li>
          <li><strong>Exceptions:</strong> When and why the method might throw exceptions</li>
        </ul>

        <h4>Specification Challenge:</h4>
        <p>You need to write a specification for a method that removes all occurrences of a specific element from a list. What are the essential components?</p>
      `,
      question: {
        type: "multiple-choice",
        question:
          "Which elements are MOST essential for a complete method specification?",
        options: [
          "Implementation details and algorithm choice",
          "Preconditions, postconditions, and exception behavior",
          "Variable names and code formatting",
          "Performance benchmarks and memory usage",
        ],
        correctAnswer: 1,
        explanation:
          "A complete specification must define preconditions (what must be true when called), postconditions (what the method guarantees), and exception behavior (when and why exceptions are thrown). Implementation details should be avoided in specifications.",
      } as Question,
    },

    "designing-specifications": {
      title: "Designing Specifications",
      description:
        "Best practices for creating effective and maintainable specifications.",
      content: `
        <h3>Specification Design Principles</h3>
        <p>Good specifications are clear, complete, and implementable.</p>
        
        <h4>Design Guidelines:</h4>
        <ul>
          <li><strong>Deterministic:</strong> Same inputs should produce same outputs</li>
          <li><strong>Declarative:</strong> Describe what, not how</li>
          <li><strong>Strong enough:</strong> Useful to clients</li>
          <li><strong>Weak enough:</strong> Implementable efficiently</li>
        </ul>

        <h4>Common Pitfalls:</h4>
        <ul>
          <li>Over-specification (too restrictive)</li>
          <li>Under-specification (too vague)</li>
          <li>Implementation details in specs</li>
          <li>Inconsistent terminology</li>
        </ul>

        <h4>Problematic Specification Example:</h4>
        <p><em>"Sort the array using quicksort and return it in ascending order, unless the array has duplicates."</em></p>
      `,
      question: {
        type: "multiple-choice",
        question:
          "What are the TWO main problems with the specification above?",
        options: [
          "It's too short and lacks detail",
          "It specifies implementation (quicksort) and has unclear behavior with duplicates",
          "It doesn't mention performance requirements",
          "It uses technical jargon that's hard to understand",
        ],
        correctAnswer: 1,
        explanation:
          "The specification has two critical flaws: (1) It specifies HOW to implement (quicksort) rather than WHAT the result should be, and (2) It's unclear what happens when duplicates are present - should it not sort at all, or handle duplicates differently? Good specifications describe the desired outcome, not the implementation method.",
      } as Question,
    },

    "abstract-data-types": {
      title: "Abstract Data Types",
      description: "Understanding and implementing abstract data types (ADTs).",
      content: `
        <h3>Abstract Data Types (ADTs)</h3>
        <p>ADTs define data types by their behavior (operations) rather than implementation.</p>
        
        <h4>Key Characteristics:</h4>
        <ul>
          <li><strong>Encapsulation:</strong> Hide implementation details</li>
          <li><strong>Interface:</strong> Define operations available to clients</li>
          <li><strong>Representation Independence:</strong> Can change implementation without affecting clients</li>
        </ul>

        <h4>Common ADTs:</h4>
        <ul>
          <li><strong>Stack:</strong> LIFO (Last In, First Out) operations</li>
          <li><strong>Queue:</strong> FIFO (First In, First Out) operations</li>
          <li><strong>Set:</strong> Collection of unique elements</li>
          <li><strong>Map:</strong> Key-value associations</li>
        </ul>

        <h4>Priority Queue Challenge:</h4>
        <p>A Priority Queue is an ADT where elements are served based on priority, not insertion order. Unlike a regular queue (FIFO), the highest priority element is always removed first.</p>
      `,
      question: {
        type: "multiple-choice",
        question:
          "Which operations are ESSENTIAL for a Priority Queue ADT interface?",
        options: [
          "push(), pop(), peek(), isEmpty(), size()",
          "insert(), removeMax(), peekMax(), isEmpty(), size()",
          "add(), remove(), contains(), iterator(), clear()",
          "enqueue(), dequeue(), front(), back(), length()",
        ],
        correctAnswer: 1,
        explanation:
          "A Priority Queue needs: insert() to add elements with priority, removeMax() to get the highest priority element, peekMax() to view the highest priority without removing it, isEmpty() to check if empty, and size() to get the count. Unlike regular queues that use enqueue/dequeue, priority queues focus on priority-based operations.",
      } as Question,
    },

    "abstraction-functions-rep-invariants": {
      title: "Abstraction Functions & Rep Invariants",
      description: "Connecting abstract values to concrete representations.",
      content: `
         <h3>Abstraction Functions & Representation Invariants</h3>
         <p>These concepts help maintain the integrity of ADT implementations.</p>
         <br />
         <h4>Abstraction Function (AF):</h4>
         <ul>
           <li>Maps concrete representation to abstract value</li>
           <li>Explains what the representation means</li>
           <li>Used in documentation and reasoning</li>
         </ul>
         <br />
         <h4>Representation Invariant (RI):</h4>
         <ul>
           <li>Properties that must always be true of the representation</li>
           <li>Checked in constructor and mutating methods</li>
           <li>Helps catch implementation bugs</li>
         </ul>
         <br />
         <h4>Stack Implementation Challenge:</h4>
         <p>Consider a Stack implemented using a linked list with a 'top' pointer. The 'top' points to the most recently added element (top of stack), and each node has a 'next' pointer to the element below it.</p>
       `,
      question: {
        type: "multiple-choice",
        question:
          "What is the most important property that the Representation Invariant (RI) must ensure for this Stack implementation?",
        options: [
          "The linked list is sorted in ascending order",
          "All nodes have the same data type",
          "The 'top' pointer is either null (empty stack) or points to a valid node in a well-formed linked list",
          "The stack contains at least one element",
        ],
        correctAnswer: 2,
        explanation:
          "The RI must ensure the 'top' pointer is either null (for an empty stack) or points to a valid node in a well-formed linked list with no cycles. This guarantees the representation is always in a valid state. The AF would map this linked list structure to the abstract stack sequence (top element first), but the RI focuses on structural integrity of the concrete representation.",
      } as Question,
    },

    "interfaces-subtyping": {
      title: "Interfaces & Subtyping",
      description: "Understanding interfaces and subtype relationships.",
      content: `
         <h3>Interfaces & Subtyping</h3>
         <p>Interfaces define contracts that classes must implement, enabling polymorphism. The <strong>Liskov Substitution Principle (LSP)</strong> ensures that objects of a superclass can be replaced with objects of a subclass without breaking the application.</p>
         <br />
         <h4>Key Concepts:</h4>
         <ul>
           <li><strong>Interface Contract:</strong> Defines what methods must be implemented and their expected behavior</li>
           <li><strong>Substitutability:</strong> Subclasses must work wherever the parent class is used</li>
           <li><strong>LSP Rule:</strong> "Objects should be replaceable with instances of their subtypes without altering program correctness"</li>
         </ul>
         <br />
         <h4>Real-World LSP Violation:</h4>
         <p>Below is code where a Square class extends Rectangle. The client code expects to resize any Rectangle, but Square breaks this expectation by throwing exceptions. Click on the line that violates LSP:</p>
       `,
      question: {
        type: "click-code",
        question:
          "Click on the line that violates the Liskov Substitution Principle:",
        codeLines: [
          "class Rectangle {",
          "  protected width: number;",
          "  protected height: number;",
          "",
          "  setWidth(w: number): void {",
          "    this.width = w;",
          "  }",
          "",
          "  setHeight(h: number): void {",
          "    this.height = h;",
          "  }",
          "",
          "  getArea(): number {",
          "    return this.width * this.height;",
          "  }",
          "}",
          "",
          "class Square extends Rectangle {",
          "  setWidth(w: number): void {",
          "    if (w !== this.height) {",
          "      throw new Error('Square sides must be equal');",
          "    }",
          "    this.width = w;",
          "  }",
          "",
          "  setHeight(h: number): void {",
          "    if (h !== this.width) {",
          "      throw new Error('Square sides must be equal');",
          "    }",
          "    this.height = h;",
          "  }",
          "}",
          "",
          "// Client code that breaks with Square:",
          "function resizeRectangle(rect: Rectangle): void {",
          "  rect.setWidth(10);  // This throws error if rect is a Square!",
          "  rect.setHeight(5);",
          "}",
        ],
        correctLines: [19, 26],
        multiSelect: true,
        explanation:
          "Lines 20 and 27 violate LSP by throwing errors that the parent Rectangle class doesn't throw. Client code expects to call setWidth() and setHeight() on any Rectangle without errors. The Square class breaks this contract by adding preconditions (width must equal height) that don't exist in Rectangle. This means Square cannot substitute for Rectangle in existing code - a clear LSP violation. Better design: use composition or separate interfaces for mutable vs immutable shapes.",
      } as Question,
    },

    "functional-programming": {
      title: "Functional Programming",
      description: "Functional programming concepts and immutability.",
      content: `
         <p>Functional programming emphasizes immutability and pure functions, avoiding side effects and mutable state.</p>
         <br />
         <h4>Core Principles:</h4>
         <ul>
           <li><strong>Immutability:</strong> Data cannot be modified after creation</li>
           <li><strong>Pure Functions:</strong> No side effects, same input always produces same output</li>
           <li><strong>Higher-Order Functions:</strong> Functions that take or return other functions</li>
           <li><strong>Function Composition:</strong> Chaining operations together</li>
         </ul>
         <br />
         <h4>Imperative vs Functional Challenge:</h4>
         <p>Convert this imperative TypeScript code to functional style:</p>
         <br />
         <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-family: monospace;">
           <strong>Imperative (mutable):</strong><br />
           let sum = 0;<br />
           for (let i = 0; i < numbers.length; i++) {<br />
           &nbsp;&nbsp;if (numbers[i] % 2 === 0) {<br />
           &nbsp;&nbsp;&nbsp;&nbsp;sum += numbers[i];<br />
           &nbsp;&nbsp;}<br />
           }<br />
           return sum;
         </div>
         <br />
         <p>Arrange the functional operations in the correct order to achieve the same result:</p>
       `,
      question: {
        type: "drag-drop-code",
        question:
          "Drag the functional programming operations into the correct order:",
        codeBlocks: [
          ".reduce((sum, x) => sum + x, 0)",
          "numbers",
          ".filter(x => x % 2 === 0)",
          "// Result: sum of all even numbers",
        ],
        correctOrder: [1, 2, 0, 3],
        explanation:
          "The functional approach: (1) Start with 'numbers' array, (2) Filter to get only even numbers using '.filter(x => x % 2 === 0)', (3) Reduce to sum them with '.reduce((sum, x) => sum + x, 0)', (4) Result is the sum. This creates: numbers.filter(x => x % 2 === 0).reduce((sum, x) => sum + x, 0). No mutable variables, no loops, just pure function composition!",
      } as Question,
    },

    equality: {
      title: "Equality",
      description: "Understanding different types of equality in programming.",
      content: `
         <p>Equality in programming has different meanings depending on context. Understanding these differences is crucial for correct object comparison and hash-based collections.</p>
         <br />
         <h4>Types of Equality:</h4>
         <ul>
           <li><strong>Reference Equality:</strong> Same object in memory (===)</li>
           <li><strong>Structural Equality:</strong> Same values in all fields</li>
           <li><strong>Behavioral Equality:</strong> Objects behave identically</li>
         </ul>
         <br />
         <h4>Critical Rule:</h4>
         <p><strong>If two objects are equal, they MUST have the same hash code!</strong> This is essential for hash-based collections like Map and Set to work correctly.</p>
         <br />
         <h4>Problematic TypeScript Class:</h4>
         <p>The following class has a serious equality bug that will break hash-based collections:</p>
         <br />
         <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px;">
           <strong>class Person {</strong><br />
           &nbsp;&nbsp;private name: string;<br />
           &nbsp;&nbsp;private age: number;<br />
           <br />
           &nbsp;&nbsp;constructor(name: string, age: number) {<br />
           &nbsp;&nbsp;&nbsp;&nbsp;this.name = name;<br />
           &nbsp;&nbsp;&nbsp;&nbsp;this.age = age;<br />
           &nbsp;&nbsp;}<br />
           <br />
           &nbsp;&nbsp;equals(other: Person): boolean {<br />
           &nbsp;&nbsp;&nbsp;&nbsp;return this.name === other.name && this.age === other.age;<br />
           &nbsp;&nbsp;}<br />
           &nbsp;&nbsp;// Missing: hashCode() method!<br />
           }<br />
           <br />
           <strong>// This will break:</strong><br />
           const map = new Map&lt;Person, string&gt;();<br />
           const person1 = new Person('Alice', 25);<br />
           const person2 = new Person('Alice', 25);<br />
           map.set(person1, 'Engineer');<br />
           console.log(map.get(person2)); // <strong style="color: red;">undefined!</strong> Should be 'Engineer'
         </div>
       `,
      question: {
        type: "multiple-choice",
        question:
          "Why does `map.get(person2)` return `undefined` even though person1 and person2 have the same name and age?",
        options: [
          "The equals() method is implemented incorrectly",
          "TypeScript Map doesn't support custom objects as keys",
          "The Person class is missing a hashCode() method, so equal objects have different hash codes",
          "person1 and person2 are different references, so they can never be equal",
        ],
        correctAnswer: 2,
        explanation:
          "The issue is that Person class has an equals() method but no hashCode() method. In hash-based collections like Map and Set, objects are first compared by hash code, then by equality. Without a proper hashCode() implementation, person1 and person2 (though equal) will have different hash codes, causing the Map to place them in different buckets. When you call map.get(person2), it looks in the wrong bucket and returns undefined. The solution: implement a hashCode() method that returns the same value for equal objects.",
      } as Question,
    },

    debugging: {
      title: "Debugging",
      description: "Systematic approaches to finding and fixing bugs.",
      content: `
         <h3>Debugging Strategies</h3>
         <p>Effective debugging requires systematic approaches and good tools.</p>
         
         <h4>Debugging Process:</h4>
         <ol>
           <li><strong>Reproduce:</strong> Create a minimal test case</li>
           <li><strong>Localize:</strong> Narrow down where the bug occurs</li>
           <li><strong>Understand:</strong> Figure out why the bug happens</li>
           <li><strong>Fix:</strong> Make the minimal necessary change</li>
           <li><strong>Test:</strong> Verify the fix works and doesn't break anything</li>
         </ol>

         <h4>Debugging Techniques:</h4>
         <ul>
           <li><strong>Print Debugging:</strong> Add logging statements</li>
           <li><strong>Debugger:</strong> Step through code execution</li>
           <li><strong>Binary Search:</strong> Divide and conquer approach</li>
           <li><strong>Rubber Duck:</strong> Explain the problem out loud</li>
         </ul>

         <h4>Common Bug Types:</h4>
         <ul>
           <li>Off-by-one errors</li>
           <li>Null pointer exceptions</li>
           <li>Race conditions</li>
           <li>Memory leaks</li>
         </ul>
       `,
      question:
        "You have a function that works for small inputs but fails for large ones. What debugging strategy would you use?",
      correctAnswer:
        "binary search to find threshold, check boundary conditions and resource limits",
      hints: [
        "Think about finding the boundary between working and failing",
        "Consider what changes between small and large inputs",
        "Look for resource limitations or algorithmic complexity issues",
      ],
    },

    concurrency: {
      title: "Concurrency",
      description: "Managing multiple threads and shared resources safely.",
      content: `
         <h3>Concurrency Fundamentals</h3>
         <p>Concurrency allows multiple tasks to execute simultaneously, but requires careful coordination.</p>
         
         <h4>Key Concepts:</h4>
         <ul>
           <li><strong>Thread:</strong> Independent execution path</li>
           <li><strong>Race Condition:</strong> Outcome depends on timing</li>
           <li><strong>Deadlock:</strong> Threads waiting for each other</li>
           <li><strong>Synchronization:</strong> Coordinating thread access</li>
         </ul>

         <h4>Synchronization Mechanisms:</h4>
         <ul>
           <li><strong>Locks/Mutexes:</strong> Exclusive access to resources</li>
           <li><strong>Semaphores:</strong> Control number of concurrent accesses</li>
           <li><strong>Monitors:</strong> High-level synchronization construct</li>
           <li><strong>Atomic Operations:</strong> Indivisible operations</li>
         </ul>

         <h4>Example Race Condition:</h4>
         <div class="bg-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Unsafe - race condition
int counter = 0;
void increment() {
    counter++;  // Read, increment, write - not atomic!
}

// Safe - synchronized
synchronized void increment() {
    counter++;
}</code></pre>
         </div>
       `,
      question:
        "Explain how deadlock can occur with two threads and two locks.",
      correctAnswer:
        "thread1 holds lock1 waits for lock2, thread2 holds lock2 waits for lock1",
      hints: [
        "Think about the order in which threads acquire locks",
        "Consider what happens when each thread holds one lock and needs another",
        "Deadlock requires circular waiting",
      ],
    },

    "recursive-data-types": {
      title: "Recursive Data Types",
      description: "Understanding and implementing recursive data structures.",
      content: `
         <p>Recursive data types are defined in terms of themselves, creating powerful abstractions for hierarchical and self-similar data structures. They form the foundation of many algorithms and data structures in computer science.</p>
         
         <br />
         <h4>Definition & Structure:</h4>
         <p>A recursive data type consists of:</p>
         <ul>
           <li><strong>Base case:</strong> Simple, non-recursive variant that terminates recursion</li>
           <li><strong>Recursive case:</strong> Contains references to the same type, enabling infinite composition</li>
           <li><strong>Type safety:</strong> TypeScript ensures structural integrity at compile time</li>
         </ul>

         <br />
         <h4>TypeScript Implementation Examples:</h4>
         
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Binary Tree - Classic recursive structure
interface TreeNode&lt;T&gt; {
  value: T;
  left: TreeNode&lt;T&gt; | null;   // Recursive reference
  right: TreeNode&lt;T&gt; | null;  // Recursive reference
}

// Linked List - Linear recursive structure  
interface ListNode&lt;T&gt; {
  data: T;
  next: ListNode&lt;T&gt; | null;  // Recursive reference
}

// Expression Tree - For mathematical expressions
type Expression = 
  | { type: 'number'; value: number }           // Base case
  | { type: 'binary'; op: '+' | '-' | '*' | '/'; // Recursive case
      left: Expression; right: Expression };</code></pre>
         </div>

         <br />
         <h4>Common Recursive Patterns:</h4>
         <ul>
           <li><strong>Trees:</strong> Binary trees, n-ary trees, syntax trees</li>
           <li><strong>Lists:</strong> Linked lists, nested lists</li>
           <li><strong>Graphs:</strong> Directed acyclic graphs, parse trees</li>
           <li><strong>Algebraic Types:</strong> Sum types, product types</li>
         </ul>

         <br />
         <h4>Processing Recursive Data:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Structural recursion follows data structure
function treeHeight&lt;T&gt;(node: TreeNode&lt;T&gt; | null): number {
  if (node === null) return 0;              // Base case
  
  const leftHeight = treeHeight(node.left);   // Recursive call
  const rightHeight = treeHeight(node.right); // Recursive call
  
  return 1 + Math.max(leftHeight, rightHeight);
}

// Pattern matching with union types
function evaluateExpression(expr: Expression): number {
  switch (expr.type) {
    case 'number':
      return expr.value;                     // Base case
    case 'binary':
      const left = evaluateExpression(expr.left);   // Recursion
      const right = evaluateExpression(expr.right); // Recursion
      
      switch (expr.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
      }
  }
}</code></pre>
         </div>

         <br />
         <h4>Benefits of Recursive Data Types:</h4>
         <ul>
           <li><strong>Natural representation:</strong> Mirrors problem structure</li>
           <li><strong>Composability:</strong> Easy to build complex from simple</li>
           <li><strong>Elegant algorithms:</strong> Recursive processing matches data</li>
           <li><strong>Type safety:</strong> Compiler catches structural errors</li>
         </ul>
       `,
      question: {
        type: "drag-drop-code",
        question:
          "Arrange the TypeScript binary tree in-order traversal code in the correct order:",
        codeBlocks: [
          "if (node === null) return;",
          "traverseInOrder(node.left);",
          "console.log(node.value);",
          "traverseInOrder(node.right);",
          "function traverseInOrder<T>(node: TreeNode<T> | null): void {",
        ],
        correctOrder: [4, 0, 1, 2, 3],
        explanation:
          "In-order traversal in TypeScript: function signature with generics → null check → left subtree → process current node → right subtree. This pattern visits nodes in sorted order for binary search trees.",
      } as Question,
    },

    "grammars-parsing": {
      title: "Grammars & Parsing",
      description: "Understanding formal grammars and parsing techniques.",
      content: `
         <p>Formal grammars provide the mathematical foundation for defining programming language syntax, while parsers transform source code text into structured Abstract Syntax Trees (ASTs) that compilers can process.</p>
         
         <br />
         <h4>Grammar Fundamentals:</h4>
         <p>A formal grammar consists of four components:</p>
         <ul>
           <li><strong>Terminals:</strong> Actual symbols/tokens that appear in the language (keywords, operators, literals)</li>
           <li><strong>Non-terminals:</strong> Abstract symbols representing language constructs (expressions, statements)</li>
           <li><strong>Productions:</strong> Rules defining how non-terminals can be rewritten</li>
           <li><strong>Start symbol:</strong> The root non-terminal from which all derivations begin</li>
         </ul>

         <br />
         <h4>Example Grammar in BNF (Backus-Naur Form):</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Simple arithmetic expression grammar
&lt;expression&gt; ::= &lt;term&gt; (('+' | '-') &lt;term&gt;)*
&lt;term&gt;       ::= &lt;factor&gt; (('*' | '/') &lt;factor&gt;)*
&lt;factor&gt;     ::= &lt;number&gt; | '(' &lt;expression&gt; ')'
&lt;number&gt;     ::= [0-9]+

// This grammar defines operator precedence:
// Multiplication/division has higher precedence than addition/subtraction</code></pre>
         </div>

         <br />
         <h4>TypeScript Parser Implementation:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// AST Node Types
type ASTNode = 
  | { type: 'number'; value: number }
  | { type: 'binary'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode };

// Tokenizer
interface Token {
  type: 'NUMBER' | 'PLUS' | 'MINUS' | 'MULTIPLY' | 'DIVIDE' | 'LPAREN' | 'RPAREN' | 'EOF';
  value: string;
}

// Recursive Descent Parser Class
class ExpressionParser {
  private tokens: Token[];
  private current = 0;

  constructor(input: string) {
    this.tokens = this.tokenize(input);
  }

  // Each non-terminal becomes a method
  parseExpression(): ASTNode {
    let left = this.parseTerm();
    
    while (this.match('PLUS', 'MINUS')) {
      const op = this.previous().type === 'PLUS' ? '+' : '-';
      const right = this.parseTerm();
      left = { type: 'binary', op, left, right };
    }
    
    return left;
  }

  parseTerm(): ASTNode {
    let left = this.parseFactor();
    
    while (this.match('MULTIPLY', 'DIVIDE')) {
      const op = this.previous().type === 'MULTIPLY' ? '*' : '/';
      const right = this.parseFactor();
      left = { type: 'binary', op, left, right };
    }
    
    return left;
  }

  parseFactor(): ASTNode {
    if (this.match('NUMBER')) {
      return { type: 'number', value: parseFloat(this.previous().value) };
    }
    
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expected ')' after expression");
      return expr;
    }
    
    throw new Error('Expected number or parenthesized expression');
  }
}</code></pre>
         </div>

         <br />
         <h4>Parsing Strategies:</h4>
         <ul>
           <li><strong>Recursive Descent:</strong> Top-down, each grammar rule becomes a function</li>
           <li><strong>LR Parsing:</strong> Bottom-up, uses shift-reduce operations with lookahead</li>
           <li><strong>LALR:</strong> Optimized LR parser, used by tools like Yacc/Bison</li>
           <li><strong>Packrat Parsing:</strong> Memoized recursive descent for PEG grammars</li>
         </ul>

         <br />
         <h4>Parser Generator Tools:</h4>
         <ul>
           <li><strong>ANTLR:</strong> Generates parsers from grammar files</li>
           <li><strong>PEG.js:</strong> JavaScript parser generator for PEG grammars</li>
           <li><strong>Nearley:</strong> Fast, feature-rich parser toolkit for JavaScript</li>
           <li><strong>TypeScript Compiler API:</strong> Built-in parsing for TypeScript/JavaScript</li>
         </ul>

         <br />
         <h4>Common Parsing Challenges:</h4>
         <ul>
           <li><strong>Left Recursion:</strong> Can cause infinite loops in recursive descent</li>
           <li><strong>Operator Precedence:</strong> Ensuring mathematical order of operations</li>
           <li><strong>Ambiguous Grammars:</strong> Multiple valid parse trees for same input</li>
           <li><strong>Error Recovery:</strong> Continuing parsing after syntax errors</li>
         </ul>
       `,
      question: {
        type: "drag-drop-code",
        question:
          "Arrange the recursive descent parser method calls in the correct order for parsing '2 + 3 * 4':",
        codeBlocks: [
          "Binary AST node created for 2 + (3 * 4)",
          "parseExpression() starts",
          "parseTerm() called for left operand",
          "parseFactor() returns number 2",
          "'+' operator found, parseTerm() called for right operand",
          "parseFactor() returns number 3, then '*' found",
          "parseFactor() returns number 4",
          "Binary AST node created for 3 * 4",
        ],
        correctOrder: [1, 2, 3, 4, 5, 6, 7, 0],
        explanation:
          "Recursive descent follows grammar structure: parseExpression → parseTerm → parseFactor. The parser respects operator precedence by having multiplication bind tighter than addition, creating the correct AST structure where '3 * 4' is evaluated before adding to 2.",
      } as Question,
    },

    promises: {
      title: "Promises",
      description: "Asynchronous programming with promises and async/await.",
      content: `
         <h3>Promises in JavaScript</h3>
         <p>Promises provide a cleaner way to handle asynchronous operations than callbacks.</p>
         
         <h4>Promise States:</h4>
         <ul>
           <li><strong>Pending:</strong> Initial state, not fulfilled or rejected</li>
           <li><strong>Fulfilled:</strong> Operation completed successfully</li>
           <li><strong>Rejected:</strong> Operation failed</li>
         </ul>

         <h4>Key Methods:</h4>
         <ul>
           <li><strong>.then():</strong> Handle successful completion</li>
           <li><strong>.catch():</strong> Handle errors</li>
           <li><strong>.finally():</strong> Execute regardless of outcome</li>
           <li><strong>Promise.all():</strong> Wait for all promises</li>
         </ul>
       `,
      question: {
        type: "click-code",
        question:
          "Click on the lines that will execute if the promise is rejected:",
        codeLines: [
          'fetch("/api/data")',
          "  .then(response => response.json())",
          '  .then(data => console.log("Success:", data))',
          '  .catch(error => console.log("Error:", error))',
          '  .finally(() => console.log("Done"));',
        ],
        correctLines: [3, 4],
        multiSelect: true,
        explanation:
          "When a promise is rejected, .catch() handles the error and .finally() always executes.",
      } as Question,
    },

    "mutual-exclusion": {
      title: "Mutual Exclusion",
      description: "Ensuring thread-safe access to shared resources.",
      content: `
         <h3>Mutual Exclusion</h3>
         <p>Mutual exclusion prevents multiple threads from accessing shared resources simultaneously.</p>
         
         <h4>Synchronization Primitives:</h4>
         <ul>
           <li><strong>Mutex:</strong> Binary lock for exclusive access</li>
           <li><strong>Semaphore:</strong> Counter-based access control</li>
           <li><strong>Monitor:</strong> High-level synchronization construct</li>
           <li><strong>Atomic operations:</strong> Indivisible operations</li>
         </ul>

         <h4>Problems to Avoid:</h4>
         <ul>
           <li><strong>Race conditions:</strong> Outcome depends on timing</li>
           <li><strong>Deadlock:</strong> Circular waiting for resources</li>
           <li><strong>Starvation:</strong> Thread never gets access</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "What is the main difference between a mutex and a semaphore?",
        options: [
          "Mutex is faster than semaphore",
          "Mutex allows only one thread, semaphore allows multiple",
          "Semaphore is only for inter-process communication",
          "Mutex works with any number of threads",
        ],
        correctAnswer: 1,
        explanation:
          "A mutex is binary (0 or 1), allowing only one thread access. A semaphore can allow multiple threads based on its counter value.",
      } as Question,
    },

    "callbacks-gui": {
      title: "Callbacks & Graphical User Interfaces",
      description: "Event-driven programming and GUI design patterns.",
      content: `
         <h3>Callbacks & GUI Programming</h3>
         <p>GUIs use event-driven programming where callbacks respond to user interactions.</p>
         
         <h4>Event-Driven Concepts:</h4>
         <ul>
           <li><strong>Event loop:</strong> Continuously processes events</li>
           <li><strong>Event handlers:</strong> Functions that respond to events</li>
           <li><strong>Event delegation:</strong> Parent handles child events</li>
           <li><strong>Asynchronous execution:</strong> Non-blocking event processing</li>
         </ul>

         <h4>Common GUI Patterns:</h4>
         <ul>
           <li><strong>Observer:</strong> Objects subscribe to events</li>
           <li><strong>Command:</strong> Encapsulate actions as objects</li>
           <li><strong>MVC:</strong> Separate model, view, and controller</li>
         </ul>
       `,
      question: {
        type: "sequence-order",
        question: "Arrange the event handling process in correct order:",
        items: [
          "Event is dispatched to handler",
          "User clicks button",
          "Event is added to event queue",
          "Event loop processes next event",
          "Handler function executes",
        ],
        correctOrder: [1, 2, 3, 0, 4],
        explanation:
          "Event handling: User action → Queue event → Event loop processes → Dispatch to handler → Execute handler",
      } as Question,
    },

    "message-passing-networking": {
      title: "Message-Passing & Networking",
      description: "Communication between distributed systems and processes.",
      content: `
         <h3>Message-Passing & Networking</h3>
         <p>Message-passing enables communication between separate processes or systems.</p>
         
         <h4>Communication Models:</h4>
         <ul>
           <li><strong>Synchronous:</strong> Sender waits for receiver</li>
           <li><strong>Asynchronous:</strong> Sender continues immediately</li>
           <li><strong>Request-Response:</strong> Two-way communication</li>
           <li><strong>Publish-Subscribe:</strong> Many-to-many messaging</li>
         </ul>

         <h4>Network Protocols:</h4>
         <ul>
           <li><strong>HTTP:</strong> Web communication protocol</li>
           <li><strong>TCP:</strong> Reliable, ordered delivery</li>
           <li><strong>UDP:</strong> Fast, unreliable delivery</li>
           <li><strong>WebSocket:</strong> Real-time bidirectional communication</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "Which protocol provides reliable, ordered delivery of messages?",
        options: [
          "UDP (User Datagram Protocol)",
          "TCP (Transmission Control Protocol)",
          "HTTP (HyperText Transfer Protocol)",
          "SMTP (Simple Mail Transfer Protocol)",
        ],
        correctAnswer: 1,
        explanation:
          "TCP guarantees reliable, ordered delivery of data with error checking and retransmission.",
      } as Question,
    },

    "little-languages": {
      title: "Little Languages",
      description: "Domain-specific languages and language design principles.",
      content: `
         <h3>Little Languages</h3>
         <p>Little languages (DSLs) are specialized languages designed for specific problem domains.</p>
         
         <h4>Types of DSLs:</h4>
         <ul>
           <li><strong>Internal DSL:</strong> Embedded in host language</li>
           <li><strong>External DSL:</strong> Standalone language with parser</li>
           <li><strong>Configuration languages:</strong> JSON, YAML, XML</li>
           <li><strong>Query languages:</strong> SQL, GraphQL</li>
         </ul>

         <h4>Design Principles:</h4>
         <ul>
           <li><strong>Domain focus:</strong> Tailored to specific problem</li>
           <li><strong>Simplicity:</strong> Easy to learn and use</li>
           <li><strong>Expressiveness:</strong> Natural problem representation</li>
           <li><strong>Tool support:</strong> IDE integration and debugging</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "What is the main advantage of a Domain-Specific Language (DSL)?",
        options: [
          "It runs faster than general-purpose languages",
          "It can solve any programming problem",
          "It provides natural expression for domain problems",
          "It requires no learning curve",
        ],
        correctAnswer: 2,
        explanation:
          "DSLs excel at providing natural, expressive ways to solve problems in their specific domain.",
      } as Question,
    },

    "software-construction-review": {
      title: "Software Construction Review",
      description: "Comprehensive review of software engineering principles.",
      content: `
         <h3>Software Construction Review</h3>
         <p>Let's review the key principles that make software robust, maintainable, and reliable.</p>
         
         <h4>Core Principles:</h4>
         <ul>
           <li><strong>Modularity:</strong> Break complex systems into manageable parts</li>
           <li><strong>Abstraction:</strong> Hide implementation details behind clean interfaces</li>
           <li><strong>Testing:</strong> Verify correctness through systematic testing</li>
           <li><strong>Documentation:</strong> Clear specifications and comments</li>
         </ul>

         <h4>Quality Attributes:</h4>
         <ul>
           <li><strong>Correctness:</strong> Does what it's supposed to do</li>
           <li><strong>Robustness:</strong> Handles unexpected situations gracefully</li>
           <li><strong>Maintainability:</strong> Easy to modify and extend</li>
           <li><strong>Performance:</strong> Efficient use of resources</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "Which principle is most important for long-term software maintenance?",
        options: [
          "Writing the fastest possible code",
          "Using the latest programming language features",
          "Creating clear abstractions and interfaces",
          "Minimizing the number of files in the project",
        ],
        correctAnswer: 2,
        explanation:
          "Clear abstractions and interfaces make software easier to understand, modify, and maintain over time.",
      } as Question,
    },
  };

  return stepContents[stepId] || null;
}

// Validate user's answer for a specific step
export function validateStepAnswer(
  stepId: string,
  userAnswer: string
): boolean {
  const stepContent = getStepContent(stepId);
  if (!stepContent) return false;

  const correctAnswer = stepContent.correctAnswer.toLowerCase();
  const normalizedAnswer = userAnswer.toLowerCase().trim();

  // Check if the answer contains key concepts from the correct answer
  const keyWords = correctAnswer.split(/[\s,]+/);
  const matchedWords = keyWords.filter(
    (word: string) => word.length > 2 && normalizedAnswer.includes(word)
  );

  // Consider it correct if at least 60% of key words are present
  return matchedWords.length >= Math.ceil(keyWords.length * 0.6);
}
