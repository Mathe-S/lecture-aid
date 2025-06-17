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
         <p>Debugging is a critical software engineering skill that combines systematic methodology with technical tools to identify, understand, and fix software defects efficiently.</p>
         
         <br />
         <h4>The Scientific Debugging Process:</h4>
         <ol>
           <li><strong>Reproduce:</strong> Create a minimal, consistent test case that triggers the bug</li>
           <li><strong>Isolate:</strong> Narrow down the problem to the smallest possible scope</li>
           <li><strong>Hypothesize:</strong> Form theories about what might be causing the issue</li>
           <li><strong>Test:</strong> Validate hypotheses through controlled experiments</li>
           <li><strong>Fix:</strong> Implement the minimal necessary change</li>
           <li><strong>Verify:</strong> Ensure the fix works and doesn't introduce new bugs</li>
         </ol>

         <br />
         <h4>Modern Debugging Techniques:</h4>
         
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// 1. Strategic Logging with Context
function processUserData(users: User[]): ProcessedUser[] {
  console.log(\`🔍 Processing \${users.length} users\`);
  
  return users.map((user, index) => {
    console.log(\`📝 Processing user \${index}: \${user.id}\`);
    
    try {
      const processed = transformUser(user);
      console.log(\`✅ Successfully processed user \${user.id}\`);
      return processed;
    } catch (error) {
      console.error(\`❌ Failed to process user \${user.id}:\`, error);
      throw error;
    }
  });
}

// 2. Assertion-Based Debugging
function calculateTotal(items: CartItem[]): number {
  console.assert(items.length > 0, 'Cart should not be empty');
  
  const total = items.reduce((sum, item) => {
    console.assert(item.price >= 0, \`Invalid price: \${item.price}\`);
    console.assert(item.quantity > 0, \`Invalid quantity: \${item.quantity}\`);
    return sum + (item.price * item.quantity);
  }, 0);
  
  console.assert(total >= 0, \`Total cannot be negative: \${total}\`);
  return total;
}</code></pre>
         </div>

         <br />
         <h4>Advanced Debugging Strategies:</h4>
         <ul>
           <li><strong>Binary Search Debugging:</strong> Systematically eliminate half the code until bug is isolated</li>
           <li><strong>Time-Travel Debugging:</strong> Step backwards through execution history</li>
           <li><strong>Differential Debugging:</strong> Compare working vs. broken versions</li>
           <li><strong>Statistical Debugging:</strong> Analyze patterns across multiple bug reports</li>
           <li><strong>Rubber Duck Debugging:</strong> Explain the problem step-by-step to clarify thinking</li>
         </ul>

         <br />
         <h4>TypeScript-Specific Debugging:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// Type Guards for Runtime Debugging
function isValidUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'email' in obj;
}

function processApiResponse(response: unknown) {
  if (!isValidUser(response)) {
    console.error('Invalid user data received:', response);
    throw new Error('Invalid user data structure');
  }
  
  // TypeScript now knows response is User
  console.log(\`Processing user: \${response.email}\`);
}

// Exhaustive Switch for Debugging Union Types
type Status = 'loading' | 'success' | 'error';

function handleStatus(status: Status): string {
  switch (status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return 'Success!';
    case 'error':
      return 'Error occurred';
    default:
      // This will cause a TypeScript error if we miss a case
      const exhaustiveCheck: never = status;
      throw new Error(\`Unhandled status: \${exhaustiveCheck}\`);
  }
}</code></pre>
         </div>

         <br />
         <h4>Common Bug Categories & Solutions:</h4>
         <ul>
           <li><strong>Logic Errors:</strong> Incorrect algorithms or business logic</li>
           <li><strong>Boundary Conditions:</strong> Off-by-one errors, empty collections</li>
           <li><strong>Null/Undefined Issues:</strong> Missing null checks, optional chaining</li>
           <li><strong>Async/Concurrency:</strong> Race conditions, promise handling</li>
           <li><strong>Type Mismatches:</strong> Runtime type errors, API contract violations</li>
           <li><strong>Performance Issues:</strong> Memory leaks, inefficient algorithms</li>
         </ul>

         <br />
         <h4>Professional Debugging Tools:</h4>
         <ul>
           <li><strong>Browser DevTools:</strong> Chrome/Firefox debugging, network analysis</li>
           <li><strong>VS Code Debugger:</strong> Breakpoints, variable inspection, call stack</li>
           <li><strong>Node.js Inspector:</strong> Server-side debugging with \`--inspect\`</li>
           <li><strong>Testing Frameworks:</strong> Jest, Vitest for systematic bug reproduction</li>
           <li><strong>Logging Libraries:</strong> Winston, Pino for structured logging</li>
           <li><strong>Error Monitoring:</strong> Sentry, Rollbar for production debugging</li>
         </ul>

         <br />
         <h4>Debugging Best Practices:</h4>
         <ul>
           <li><strong>Start with the simplest explanation</strong> (Occam's Razor)</li>
           <li><strong>Change one thing at a time</strong> to isolate cause and effect</li>
           <li><strong>Keep detailed notes</strong> of what you've tried</li>
           <li><strong>Take breaks</strong> to avoid tunnel vision</li>
           <li><strong>Ask for help</strong> when stuck - fresh eyes catch different things</li>
         </ul>
       `,
      question: {
        type: "click-code",
        question:
          "Click on the lines that represent good debugging practices in this TypeScript function:",
        codeLines: [
          "function processPayment(amount: number, userId: string): Promise<PaymentResult> {",
          "  console.log(`💰 Processing payment: $${amount} for user ${userId}`);",
          "  ",
          "  if (amount <= 0) {",
          "    throw new Error('Invalid amount');",
          "  }",
          "  ",
          "  const user = await getUserById(userId);",
          "  console.log(`👤 User found: ${user.email}`);",
          "  ",
          "  try {",
          "    const result = await chargeCard(user.cardId, amount);",
          "    console.log(`✅ Payment successful: ${result.transactionId}`);",
          "    return result;",
          "  } catch (error) {",
          "    console.error(`❌ Payment failed for user ${userId}:`, error);",
          "    throw error;",
          "  }",
          "}",
        ],
        correctLines: [1, 4, 8, 12, 15],
        multiSelect: true,
        explanation:
          "Good debugging practices include: strategic logging with context (line 1, 8, 12), input validation with clear error messages (line 4), and comprehensive error handling with detailed context (line 15). These practices help track execution flow and identify issues quickly.",
      } as Question,
    },

    concurrency: {
      title: "Concurrency",
      description: "Managing multiple threads and shared resources safely.",
      content: `
         <p>Concurrency is the art of managing multiple computations that execute simultaneously and potentially interact. While powerful, it introduces significant challenges like race conditions and deadlocks that must be handled carefully.</p>
         
         <br />
         <h4>Concurrency vs. Parallelism:</h4>
         <ul>
           <li><strong>Concurrency:</strong> Dealing with many things at once (e.g., handling multiple web requests).</li>
           <li><strong>Parallelism:</strong> Doing many things at once (e.g., using multiple CPU cores to process data).</li>
         </ul>

         <br />
         <h4>Common Concurrency Problems:</h4>
         <ul>
           <li><strong>Race Condition:</strong> Outcome depends on non-deterministic timing of operations.</li>
           <li><strong>Deadlock:</strong> Two or more processes are blocked forever, waiting for each other.</li>
           <li><strong>Starvation:</strong> A process is perpetually denied necessary resources.</li>
           <li><strong>Livelock:</strong> Processes are busy but make no progress.</li>
         </ul>

         <br />
         <h4>Race Condition Example in TypeScript:</h4>
         <p>The classic "read-modify-write" race condition. Two async operations fetch a value, increment it, and write it back. The final value will be wrong.</p>
         
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">let sharedCounter = 0;

async function increment() {
  const currentValue = sharedCounter; // Read
  await new Promise(r => setTimeout(r, 10)); // Simulate network/IO delay
  sharedCounter = currentValue + 1;  // Write
}

// If two calls to increment() run concurrently:
// Call 1 reads 0.
// Call 2 reads 0.
// Call 1 writes 1.
// Call 2 writes 1.
// Expected: 2, Actual: 1. This is a race condition.</code></pre>
         </div>

         <br />
         <h4>Synchronization Mechanisms:</h4>
         <ul>
           <li><strong>Locks (Mutexes):</strong> Ensure only one thread can enter a critical section at a time.</li>
           <li><strong>Semaphores:</strong> Allow a certain number of threads to access a resource.</li>
           <li><strong>Atomics:</strong> Hardware-level atomic operations for lock-free concurrency (e.g., \`Atomics\` in JS for SharedArrayBuffers).</li>
           <li><strong>Transactional Memory:</strong> Grouping memory operations into atomic transactions.</li>
         </ul>

         <br />
         <h4>Solving Race Conditions with a Lock:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// A simple async lock implementation
class AsyncLock {
  private isLocked = false;
  private queue: (() => void)[] = [];

  async acquire() {
    if (!this.isLocked) {
      this.isLocked = true;
      return;
    }
    await new Promise<void>(resolve => this.queue.push(resolve));
  }

  release() {
    if (this.queue.length > 0) {
      this.queue.shift()!();
    } else {
      this.isLocked = false;
    }
  }
}

const lock = new AsyncLock();
let safeCounter = 0;

async function safeIncrement() {
  await lock.acquire();
  try {
    const currentValue = safeCounter;
    await new Promise(r => setTimeout(r, 10));
    safeCounter = currentValue + 1;
  } finally {
    lock.release(); // Always release the lock!
  }
}</code></pre>
         </div>
       `,
      question: {
        type: "click-code",
        question:
          "Click on the line where the non-atomic operation creates a race condition.",
        codeLines: [
          "let sharedCounter = 0;",
          "",
          "async function increment() {",
          "  const currentValue = sharedCounter;",
          "  await new Promise(r => setTimeout(r, 10));",
          "  sharedCounter = currentValue + 1;",
          "}",
          "",
          "// What if two calls run at the same time?",
          "increment();",
          "increment();",
        ],
        correctLines: [5],
        explanation:
          "Line 6 (`sharedCounter = currentValue + 1;`) is the critical part of the race condition. It's a 'read-modify-write' operation that is not atomic. An `await` on line 5 introduces a delay, allowing another `increment` call to read the stale `sharedCounter` value before the first call can write its updated value back. This leads to lost updates.",
      } as Question,
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
           <pre><code class="language-typescript">// Binary Tree - Classic recursive structure
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
           <pre><code class="language-typescript">// Structural recursion follows data structure
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
           <pre><code class="language-ebnf">// Simple arithmetic expression grammar
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
           <pre><code class="language-typescript">// AST Node Types
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
      title: "Promises & Async/Await",
      description:
        "Mastering asynchronous operations in modern JavaScript and TypeScript.",
      content: `
         <p>Promises are objects representing the eventual completion or failure of an asynchronous operation. <strong><code>async/await</code></strong> is modern syntactic sugar built on top of promises, making async code look and behave more like synchronous code.</p>
         
         <br />
         <h4>Promise States:</h4>
         <ul>
           <li><strong>Pending:</strong> The initial state; not yet fulfilled or rejected.</li>
           <li><strong>Fulfilled:</strong> The operation completed successfully, with a resulting value.</li>
           <li><strong>Rejected:</strong> The operation failed, with a reason (an error).</li>
         </ul>

         <br />
         <h4>Creating and Using Promises:</h4>
         <p>The modern approach uses <code>async/await</code> with <code>try/catch</code> for clean, readable code.</p>

         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// 1. A function that returns a Promise
function fetchData(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({ data: \`Content from \${url}\` });
      } else {
        reject(new Error('Network request failed'));
      }
    }, 1000);
  });
}

// 2. Consuming the Promise with async/await
async function processData(url: string) {
  console.log('Fetching data...');
  try {
    const response = await fetchData(url); // Pauses here until promise settles
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    console.log('Operation finished.');
  }
}</code></pre>
         </div>

         <br />
         <h4>Promise Combinators: Running Promises in Parallel</h4>
         <ul>
           <li><strong><code>Promise.all()</code>:</strong> Fulfills when all promises fulfill. Rejects if any promise rejects.</li>
           <li><strong><code>Promise.allSettled()</code>:</strong> Fulfills when all promises settle (fulfill or reject). Never rejects.</li>
           <li><strong><code>Promise.race()</code>:</strong> Settles as soon as the first promise settles.</li>
           <li><strong><code>Promise.any()</code>:</strong> Fulfills as soon as the first promise fulfills. Rejects only if all promises reject.</li>
         </ul>
         
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">async function fetchMultipleResources() {
  try {
    const [user, posts, comments] = await Promise.all([
      fetchData('/api/user/1'),
      fetchData('/api/posts/1'),
      fetchData('/api/comments/1')
    ]);
    console.log('All resources fetched concurrently:', { user, posts, comments });
  } catch (error) {
    console.error('One of the requests failed:', error.message);
  }
}</code></pre>
         </div>

         <br />
         <h4>Common Pitfalls:</h4>
         <ul>
           <li><strong>Forgetting <code>await</code>:</strong> The function will continue without waiting for the promise, often leading to race conditions.</li>
           <li><strong>Uncaught promise rejections:</strong> Forgetting a <code>.catch()</code> block or a <code>try/catch</code> around <code>await</code>.</li>
           <li><strong>Mixing <code>.then()</code> and <code>await</code>:</strong> Can lead to confusing and hard-to-read code. Stick to one style per function.</li>
           <li><strong>Sequential <code>await</code>s instead of <code>Promise.all()</code>:</strong> Fetching independent resources one by one is much slower than fetching them concurrently.</li>
         </ul>
       `,
      question: {
        type: "drag-drop-code",
        question:
          "You need to fetch user data and their posts concurrently. Arrange the `async/await` code to do this efficiently and safely.",
        codeBlocks: [
          "console.log('User:', user, 'Posts:', posts);",
          "}",
          "  fetchUserData(userId),",
          "async function getUserProfile(userId: string) {",
          "} catch (error) {",
          "]);",
          "try {",
          "const [user, posts] = await Promise.all([",
          "console.error('Failed to fetch profile:', error);",
          "  fetchUserPosts(userId)",
          "}",
        ],
        correctOrder: [3, 6, 7, 2, 9, 5, 0, 4, 8, 1, 10],
        explanation:
          "The most efficient and safest way is to wrap concurrent `Promise.all` calls within a `try/catch` block. This allows you to fetch independent resources in parallel and handle any potential failures from either request in a single, clean error-handling block.",
      } as Question,
    },

    "mutual-exclusion": {
      title: "Mutual Exclusion",
      description: "Ensuring thread-safe access to shared resources.",
      content: `
         <p>Mutual exclusion is a fundamental concept in concurrent programming that ensures only one thread can access a shared resource at a time. This prevents data corruption and maintains consistency in multi-threaded applications.</p>
         
         <br />
         <h4>Core Problem: Shared Resource Access</h4>
         <p>When multiple threads access shared data simultaneously, we can get unpredictable results due to race conditions. Mutual exclusion mechanisms solve this by providing controlled access.</p>

         <br />
         <h4>Synchronization Primitives:</h4>
         <ul>
           <li><strong>Mutex (Mutual Exclusion):</strong> Binary lock ensuring only one thread can enter a critical section</li>
           <li><strong>Semaphore:</strong> Counter-based mechanism allowing N threads to access a resource</li>
           <li><strong>Monitor:</strong> High-level construct combining data and synchronization methods</li>
           <li><strong>Atomic Operations:</strong> Hardware-level indivisible operations</li>
           <li><strong>Read-Write Locks:</strong> Allow multiple readers or one writer</li>
         </ul>

         <br />
         <h4>JavaScript/Node.js Context:</h4>
         <p>While JavaScript is single-threaded, mutual exclusion concepts apply to:</p>
         <ul>
           <li><strong>Web Workers:</strong> True parallelism in browsers</li>
           <li><strong>SharedArrayBuffer:</strong> Shared memory between workers</li>
           <li><strong>Node.js Worker Threads:</strong> CPU-intensive parallel processing</li>
           <li><strong>Async Operations:</strong> Preventing concurrent modifications</li>
         </ul>

         <br />
         <h4>Async Mutual Exclusion Example:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// Problem: Multiple async operations modifying shared state
class BankAccount {
  private balance = 1000;
  private lock = new AsyncMutex();

  async withdraw(amount: number): Promise<boolean> {
    // CRITICAL SECTION: Must be protected!
    await this.lock.acquire();
    try {
      if (this.balance >= amount) {
        // Simulate async operation (database update, etc.)
        await new Promise(resolve => setTimeout(resolve, 100));
        this.balance -= amount;
        return true;
      }
      return false;
    } finally {
      this.lock.release(); // Always release the lock!
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

// Simple Async Mutex Implementation
class AsyncMutex {
  private isLocked = false;
  private waitQueue: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this.isLocked) {
      this.isLocked = true;
      return;
    }
    
    // Wait in queue if locked
    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next(); // Wake up next waiter
    } else {
      this.isLocked = false;
    }
  }
}</code></pre>
         </div>

         <br />
         <h4>Web Workers with SharedArrayBuffer:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// Shared memory between workers requires careful synchronization
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// Atomic operations for thread-safe access
function atomicIncrement(index: number): number {
  return Atomics.add(sharedArray, index, 1);
}

// Mutex using atomic operations
class AtomicMutex {
  private lockIndex: number;

  constructor(sharedArray: Int32Array, index: number) {
    this.lockIndex = index;
    Atomics.store(sharedArray, index, 0); // 0 = unlocked
  }

  tryLock(): boolean {
    // Atomic compare-and-swap: if 0, set to 1
    return Atomics.compareExchange(sharedArray, this.lockIndex, 0, 1) === 0;
  }

  unlock(): void {
    Atomics.store(sharedArray, this.lockIndex, 0);
  }
}</code></pre>
         </div>

         <br />
         <h4>Common Synchronization Problems:</h4>
         <ul>
           <li><strong>Deadlock:</strong> Two threads waiting for each other's locks</li>
           <li><strong>Livelock:</strong> Threads keep changing state but make no progress</li>
           <li><strong>Starvation:</strong> A thread never gets access to the resource</li>
           <li><strong>Priority Inversion:</strong> High-priority thread blocked by low-priority thread</li>
         </ul>

         <br />
         <h4>Best Practices:</h4>
         <ul>
           <li><strong>Always use try/finally:</strong> Ensure locks are released even if exceptions occur</li>
           <li><strong>Keep critical sections small:</strong> Minimize time holding locks</li>
           <li><strong>Avoid nested locks:</strong> Prevents deadlock situations</li>
           <li><strong>Use timeouts:</strong> Prevent indefinite waiting</li>
           <li><strong>Consider lock-free algorithms:</strong> Use atomic operations when possible</li>
         </ul>
       `,
      question: {
        type: "click-code",
        question:
          "Click on the lines where mutual exclusion (synchronization) is most critically needed:",
        codeLines: [
          "class Counter {",
          "  private count = 0;",
          "  private operations: string[] = [];",
          "",
          "  async increment(): Promise<void> {",
          "    const currentCount = this.count;",
          "    await new Promise(r => setTimeout(r, 10)); // Simulate async work",
          "    this.count = currentCount + 1;",
          "    this.operations.push(`Incremented to ${this.count}`);",
          "  }",
          "",
          "  async decrement(): Promise<void> {",
          "    const currentCount = this.count;",
          "    await new Promise(r => setTimeout(r, 10)); // Simulate async work",
          "    this.count = currentCount - 1;",
          "    this.operations.push(`Decremented to ${this.count}`);",
          "  }",
          "",
          "  getCount(): number {",
          "    return this.count;",
          "  }",
          "}",
        ],
        correctLines: [5, 6, 7, 8, 12, 13, 14, 15],
        multiSelect: true,
        explanation:
          "Lines 6-9 and 13-16 contain critical sections where shared state (this.count and this.operations) is read and modified. The async delay between reading and writing creates a race condition window where multiple concurrent calls can interfere with each other. These sections need mutual exclusion to ensure atomic read-modify-write operations.",
      } as Question,
    },

    "callbacks-gui": {
      title: "Callbacks & Graphical User Interfaces",
      description: "Event-driven programming and modern GUI design patterns.",
      content: `
         <p>Graphical User Interfaces (GUIs) are fundamentally <strong>event-driven systems</strong> where user interactions trigger callbacks that update the application state. This paradigm differs from traditional sequential programming by responding to unpredictable user actions asynchronously.</p>
         
         <br />
         <h4>Event-Driven Architecture:</h4>
         <p>Modern GUI frameworks use an event loop that continuously monitors for user interactions:</p>
         <ul>
           <li><strong>Event Loop:</strong> The central dispatcher that processes events from a queue</li>
           <li><strong>Event Queue:</strong> FIFO buffer holding events waiting to be processed</li>
           <li><strong>Event Handlers/Callbacks:</strong> Functions registered to respond to specific events</li>
           <li><strong>Event Propagation:</strong> How events bubble up or capture down the DOM tree</li>
         </ul>

         <br />
         <h4>Callback Patterns in Modern JavaScript/TypeScript:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// 1. Traditional Event Listeners
button.addEventListener('click', function(event) {
  console.log('Button clicked!', event.target);
});

// 2. Arrow Function Callbacks (Modern)
button.addEventListener('click', (event) => {
  updateCounter(event.currentTarget.dataset.value);
});

// 3. Method Callbacks with Proper 'this' Binding
class TodoApp {
  private todos: Todo[] = [];
  
  constructor() {
    // Bind methods to preserve 'this' context
    this.handleAddTodo = this.handleAddTodo.bind(this);
    this.handleDeleteTodo = this.handleDeleteTodo.bind(this);
  }
  
  handleAddTodo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.todos.push({ id: Date.now(), text: input.value, completed: false });
    this.render();
  }
  
  handleDeleteTodo(id: number): void {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.render();
  }
}</code></pre>
         </div>

         <br />
         <h4>Essential GUI Design Patterns:</h4>
         
         <p><strong>1. Observer Pattern (Event System):</strong></p>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-2">
           <pre><code class="language-typescript">// Custom Event System
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }
}</code></pre>
         </div>

         <p><strong>2. Command Pattern (Action Encapsulation):</strong></p>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-2">
           <pre><code class="language-typescript">// Encapsulate actions for undo/redo functionality
interface Command {
  execute(): void;
  undo(): void;
}

class AddTodoCommand implements Command {
  constructor(
    private todoList: TodoList,
    private todoText: string,
    private todoId?: number
  ) {}
  
  execute(): void {
    this.todoId = this.todoList.addTodo(this.todoText);
  }
  
  undo(): void {
    if (this.todoId) {
      this.todoList.removeTodo(this.todoId);
    }
  }
}

class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;
  
  executeCommand(command: Command): void {
    // Remove any commands after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    command.execute();
    this.history.push(command);
    this.currentIndex++;
  }
  
  undo(): void {
    if (this.currentIndex >= 0) {
      this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }
  
  redo(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.history[this.currentIndex].execute();
    }
  }
}</code></pre>
         </div>

         <p><strong>3. Model-View-Controller (MVC) Pattern:</strong></p>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-2">
           <pre><code class="language-typescript">// Separation of concerns in GUI applications
class TodoModel {
  private todos: Todo[] = [];
  private observers: Function[] = [];
  
  addObserver(observer: Function): void {
    this.observers.push(observer);
  }
  
  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.todos));
  }
  
  addTodo(text: string): void {
    this.todos.push({ id: Date.now(), text, completed: false });
    this.notifyObservers();
  }
  
  toggleTodo(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.notifyObservers();
    }
  }
}

class TodoView {
  constructor(private container: HTMLElement) {}
  
  render(todos: Todo[]): void {
    this.container.innerHTML = todos.map(todo => 
      \`<div class="todo \${todo.completed ? 'completed' : ''}">
         <input type="checkbox" \${todo.completed ? 'checked' : ''} 
                data-id="\${todo.id}">
         <span>\${todo.text}</span>
         <button data-id="\${todo.id}" class="delete">Delete</button>
       </div>\`
    ).join('');
  }
}

class TodoController {
  constructor(
    private model: TodoModel,
    private view: TodoView
  ) {
    // Model updates trigger view re-render
    this.model.addObserver((todos: Todo[]) => {
      this.view.render(todos);
    });
    
    // Set up event delegation for dynamic content
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Event delegation: handle events on parent container
    this.view.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.matches('input[type="checkbox"]')) {
        const id = parseInt(target.dataset.id!);
        this.model.toggleTodo(id);
      }
      
      if (target.matches('.delete')) {
        const id = parseInt(target.dataset.id!);
        this.model.deleteTodo(id);
      }
    });
  }
}</code></pre>
         </div>

         <br />
         <h4>Modern GUI Framework Concepts:</h4>
         <ul>
           <li><strong>Virtual DOM:</strong> Efficient diffing and updating (React, Vue)</li>
           <li><strong>Reactive Programming:</strong> Automatic UI updates when data changes (RxJS, MobX)</li>
           <li><strong>Component Architecture:</strong> Reusable, encapsulated UI components</li>
           <li><strong>State Management:</strong> Centralized application state (Redux, Zustand)</li>
           <li><strong>Event Delegation:</strong> Efficient event handling for dynamic content</li>
         </ul>

         <br />
         <h4>Callback Challenges and Solutions:</h4>
         <ul>
           <li><strong>Callback Hell:</strong> Solved with Promises, async/await</li>
           <li><strong>Memory Leaks:</strong> Proper event listener cleanup</li>
           <li><strong>Context Loss:</strong> Arrow functions or explicit binding</li>
           <li><strong>Performance:</strong> Event delegation, debouncing, throttling</li>
         </ul>

         <br />
         <h4>Event Handling Best Practices:</h4>
         <ul>
           <li><strong>Use Event Delegation:</strong> Handle events on parent containers for dynamic content</li>
           <li><strong>Debounce/Throttle:</strong> Limit rapid event firing (scroll, resize, input)</li>
           <li><strong>Prevent Default:</strong> Control default browser behavior when needed</li>
           <li><strong>Clean Up:</strong> Remove event listeners when components unmount</li>
           <li><strong>Accessibility:</strong> Support keyboard navigation and screen readers</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "In the MVC pattern for GUI applications, what is the primary responsibility of the Controller?",
        options: [
          "Storing and managing the application's data and business logic",
          "Rendering the user interface and displaying data to the user",
          "Handling user input and coordinating between Model and View",
          "Managing network requests and API communications",
        ],
        correctAnswer: 2,
        explanation:
          "The Controller in MVC acts as an intermediary that handles user input (events like clicks, form submissions), processes that input, and coordinates updates between the Model (data) and View (UI). It contains the application logic that responds to user interactions, updates the model when needed, and triggers view updates. The Model handles data/business logic, the View handles presentation, and the Controller handles the interaction logic that connects them.",
      } as Question,
    },

    "message-passing-networking": {
      title: "Message-Passing & Networking",
      description:
        "Modern distributed systems communication and networking protocols.",
      content: `
         <p>Message-passing is the fundamental mechanism that enables <strong>distributed systems</strong> to communicate, coordinate, and share data across networks. Modern applications rely on sophisticated networking protocols and patterns to achieve scalability, reliability, and performance in distributed environments.</p>
         
         <br />
         <h4>Message-Passing Paradigms:</h4>
         <p>Different communication patterns serve different architectural needs:</p>
         <ul>
           <li><strong>Synchronous Communication:</strong> Sender blocks until receiver responds (RPC, HTTP request-response)</li>
           <li><strong>Asynchronous Communication:</strong> Sender continues immediately, no blocking (message queues, events)</li>
           <li><strong>Request-Response:</strong> Traditional client-server interaction with acknowledgment</li>
           <li><strong>Publish-Subscribe:</strong> Decoupled many-to-many messaging via message brokers</li>
           <li><strong>Message Queues:</strong> Reliable delivery with persistence and retry mechanisms</li>
           <li><strong>Event Streaming:</strong> Continuous data flow processing (Apache Kafka, AWS Kinesis)</li>
         </ul>

         <br />
         <h4>Network Protocol Stack:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// Modern HTTP Client Implementation
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...defaultHeaders
    };
  }
  
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseURL}\${endpoint}\`;
    
    const config: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };
    
    if (data && ['POST', 'PUT'].includes(method)) {
      config.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new HttpError(
          \`HTTP \${response.status}: \${response.statusText}\`,
          response.status,
          response.statusText
        );
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as unknown as T;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new NetworkError('Network request failed', error);
    }
  }
  
  // Convenience methods
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }
  
  post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }
}

class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

class NetworkError extends Error {
  constructor(message: string, public cause: any) {
    super(message);
    this.name = 'NetworkError';
  }
}</code></pre>
         </div>

         <br />
         <h4>WebSocket Real-Time Communication:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// WebSocket Client with Reconnection Logic
class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: string[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  
  constructor(url: string) {
    this.url = url;
    this.connect();
  }
  
  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.emit('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          
          // Handle specific message types
          if (data.type) {
            this.emit(data.type, data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(\`Reconnecting in \${delay}ms (attempt \${this.reconnectAttempts})\`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  send(message: any): void {
    const jsonMessage = JSON.stringify(message);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(jsonMessage);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(jsonMessage);
    }
  }
  
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(message);
    }
  }
  
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data?: any): void {
    const callbacks = this.eventListeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  close(): void {
    this.ws?.close(1000, 'Client closing connection');
  }
}</code></pre>
         </div>

         <br />
         <h4>Message Queue Pattern:</h4>
         <div class="bg-gray-900 text-gray-100 p-4 rounded-lg mt-4">
           <pre><code class="language-typescript">// Simple Message Queue Implementation
interface Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class MessageQueue {
  private queue: Message[] = [];
  private processing = false;
  private subscribers: Map<string, Function[]> = new Map();
  
  async publish(type: string, payload: any, maxRetries = 3): Promise<void> {
    const message: Message = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };
    
    this.queue.push(message);
    
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  subscribe(messageType: string, handler: Function): void {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, []);
    }
    this.subscribers.get(messageType)!.push(handler);
  }
  
  private async processQueue(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue.shift()!;
      
      try {
        await this.deliverMessage(message);
      } catch (error) {
        console.error(\`Failed to deliver message \${message.id}:\`, error);
        
        if (message.retryCount < message.maxRetries) {
          message.retryCount++;
          // Exponential backoff
          setTimeout(() => {
            this.queue.unshift(message);
          }, 1000 * Math.pow(2, message.retryCount));
        } else {
          console.error(\`Message \${message.id} exceeded max retries, moving to dead letter queue\`);
          this.handleDeadLetter(message);
        }
      }
    }
    
    this.processing = false;
  }
  
  private async deliverMessage(message: Message): Promise<void> {
    const handlers = this.subscribers.get(message.type) || [];
    
    if (handlers.length === 0) {
      throw new Error(\`No handlers registered for message type: \${message.type}\`);
    }
    
    // Deliver to all subscribers
    const promises = handlers.map(handler => 
      Promise.resolve(handler(message.payload, message))
    );
    
    await Promise.all(promises);
  }
  
  private handleDeadLetter(message: Message): void {
    // In production, this would go to a dead letter queue
    console.log('Dead letter:', message);
  }
}</code></pre>
         </div>

         <br />
         <h4>Modern Network Protocols:</h4>
         <ul>
           <li><strong>HTTP/1.1:</strong> Traditional request-response with persistent connections</li>
           <li><strong>HTTP/2:</strong> Multiplexing, server push, binary protocol</li>
           <li><strong>HTTP/3 (QUIC):</strong> UDP-based, reduced latency, built-in security</li>
           <li><strong>WebSocket:</strong> Full-duplex communication over single TCP connection</li>
           <li><strong>gRPC:</strong> High-performance RPC framework with Protocol Buffers</li>
           <li><strong>GraphQL:</strong> Query language for APIs with single endpoint</li>
           <li><strong>Server-Sent Events (SSE):</strong> Server-to-client streaming</li>
           <li><strong>WebRTC:</strong> Peer-to-peer real-time communication</li>
         </ul>

         <br />
         <h4>Distributed System Challenges:</h4>
         <ul>
           <li><strong>Network Partitions:</strong> Systems must handle network splits gracefully</li>
           <li><strong>Latency & Throughput:</strong> Balancing response time with data volume</li>
           <li><strong>Fault Tolerance:</strong> Graceful degradation when components fail</li>
           <li><strong>Consistency:</strong> Ensuring data consistency across distributed nodes</li>
           <li><strong>Load Balancing:</strong> Distributing requests across multiple servers</li>
           <li><strong>Service Discovery:</strong> Dynamic finding and connecting to services</li>
           <li><strong>Circuit Breakers:</strong> Preventing cascade failures</li>
           <li><strong>Rate Limiting:</strong> Protecting services from overload</li>
         </ul>

         <br />
         <h4>Message Serialization Formats:</h4>
         <ul>
           <li><strong>JSON:</strong> Human-readable, widely supported, larger size</li>
           <li><strong>Protocol Buffers:</strong> Binary, compact, schema evolution</li>
           <li><strong>MessagePack:</strong> Binary JSON-like format, smaller than JSON</li>
           <li><strong>Apache Avro:</strong> Schema evolution, compact binary encoding</li>
           <li><strong>XML:</strong> Verbose but self-describing with schema validation</li>
         </ul>

         <br />
         <h4>Networking Best Practices:</h4>
         <ul>
           <li><strong>Connection Pooling:</strong> Reuse connections to avoid setup overhead</li>
           <li><strong>Timeout Configuration:</strong> Set appropriate timeouts for all network calls</li>
           <li><strong>Retry Logic:</strong> Implement exponential backoff with jitter</li>
           <li><strong>Circuit Breakers:</strong> Fail fast when downstream services are down</li>
           <li><strong>Compression:</strong> Use gzip/brotli to reduce bandwidth</li>
           <li><strong>Caching:</strong> Cache responses to reduce network calls</li>
           <li><strong>Security:</strong> Always use TLS/SSL for sensitive data</li>
           <li><strong>Monitoring:</strong> Track latency, throughput, and error rates</li>
         </ul>

         <br />
         <h4>Modern Architectural Patterns:</h4>
         <ul>
           <li><strong>Microservices:</strong> Distributed services communicating via APIs</li>
           <li><strong>Event-Driven Architecture:</strong> Services react to events asynchronously</li>
           <li><strong>CQRS:</strong> Command Query Responsibility Segregation</li>
           <li><strong>Event Sourcing:</strong> Store state changes as sequence of events</li>
           <li><strong>Saga Pattern:</strong> Manage distributed transactions</li>
           <li><strong>API Gateway:</strong> Single entry point for client requests</li>
         </ul>
       `,
      question: {
        type: "click-code",
        question:
          "In this WebSocket client implementation, click on the lines that implement the exponential backoff retry strategy:",
        codeLines: [
          "private scheduleReconnect(): void {",
          "  this.reconnectAttempts++;",
          "  const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);",
          "  ",
          "  console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);",
          "  ",
          "  setTimeout(() => {",
          "    this.connect();",
          "  }, delay);",
          "}",
        ],
        correctLines: [1, 2, 6, 7, 8],
        multiSelect: true,
        explanation:
          "Lines 2-3 implement exponential backoff by incrementing attempts and calculating delay using Math.pow(2, attempts-1). Lines 7-9 use setTimeout with the calculated delay to schedule reconnection. This pattern increases wait time exponentially (1s, 2s, 4s, 8s...) to avoid overwhelming a failing server while still attempting recovery. The exponential backoff strategy is crucial for robust distributed systems.",
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
