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
         
         <h4>Abstraction Function (AF):</h4>
         <ul>
           <li>Maps concrete representation to abstract value</li>
           <li>Explains what the representation means</li>
           <li>Used in documentation and reasoning</li>
         </ul>

         <h4>Representation Invariant (RI):</h4>
         <ul>
           <li>Properties that must always be true of the representation</li>
           <li>Checked in constructor and mutating methods</li>
           <li>Helps catch implementation bugs</li>
         </ul>

         <h4>Example - IntSet using array:</h4>
         <div class="bg-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Rep: elements[0..size-1] contains the set elements
// AF: {elements[i] | 0 <= i < size}
// RI: elements != null && 0 <= size <= elements.length
//     && no duplicates in elements[0..size-1]</code></pre>
         </div>
       `,
      question:
        "Write the abstraction function and rep invariant for a Stack implemented using a linked list with a 'top' pointer.",
      correctAnswer:
        "AF maps linked list to stack sequence, RI ensures top points to valid node or null",
      hints: [
        "Think about how the linked list represents the stack order",
        "Consider what properties the 'top' pointer must satisfy",
        "What invariants ensure the linked list is well-formed?",
      ],
    },

    "interfaces-subtyping": {
      title: "Interfaces & Subtyping",
      description: "Understanding interfaces and subtype relationships.",
      content: `
         <h3>Interfaces & Subtyping</h3>
         <p>Interfaces define contracts that classes must implement, enabling polymorphism.</p>
         
         <h4>Key Concepts:</h4>
         <ul>
           <li><strong>Interface:</strong> Contract specifying methods a class must implement</li>
           <li><strong>Subtyping:</strong> Relationship where one type can substitute for another</li>
           <li><strong>Liskov Substitution Principle:</strong> Subtypes must be substitutable for their base types</li>
         </ul>

         <h4>Example:</h4>
         <div class="bg-gray-100 p-4 rounded-lg mt-4">
           <pre><code>interface Shape {
    double area();
    double perimeter();
}

class Circle implements Shape {
    private double radius;
    
    public double area() { return Math.PI * radius * radius; }
    public double perimeter() { return 2 * Math.PI * radius; }
}</code></pre>
         </div>
       `,
      question:
        "Explain why this violates the Liskov Substitution Principle: A Square class that throws an exception when width != height in setWidth().",
      correctAnswer:
        "violates LSP because Square cannot substitute Rectangle, breaks expected behavior",
      hints: [
        "Think about what clients expect from a Rectangle",
        "Consider what happens when Square is used where Rectangle is expected",
        "LSP requires subtypes to strengthen postconditions, not add restrictions",
      ],
    },

    "functional-programming": {
      title: "Functional Programming",
      description: "Functional programming concepts and immutability.",
      content: `
         <h3>Functional Programming</h3>
         <p>Functional programming emphasizes immutability and pure functions.</p>
         
         <h4>Core Principles:</h4>
         <ul>
           <li><strong>Immutability:</strong> Objects cannot be modified after creation</li>
           <li><strong>Pure Functions:</strong> No side effects, same input always produces same output</li>
           <li><strong>Higher-Order Functions:</strong> Functions that take or return other functions</li>
           <li><strong>Recursion:</strong> Preferred over iteration</li>
         </ul>

         <h4>Benefits:</h4>
         <ul>
           <li>Easier to reason about and test</li>
           <li>Better for concurrent programming</li>
           <li>Fewer bugs related to shared mutable state</li>
         </ul>

         <h4>Example:</h4>
         <div class="bg-gray-100 p-4 rounded-lg mt-4">
           <pre><code>// Immutable list operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);  // Pure function
const evens = numbers.filter(x => x % 2 === 0);  // Pure function</code></pre>
         </div>
       `,
      question:
        "Convert this imperative code to functional style: 'sum all even numbers in an array using a for loop'.",
      correctAnswer:
        "array.filter(x => x % 2 === 0).reduce((sum, x) => sum + x, 0)",
      hints: [
        "Use filter to get even numbers",
        "Use reduce to sum the results",
        "Avoid mutating variables or using loops",
      ],
    },

    equality: {
      title: "Equality",
      description: "Understanding different types of equality in programming.",
      content: `
         <h3>Equality in Programming</h3>
         <p>Different types of equality serve different purposes in software design.</p>
         
         <h4>Types of Equality:</h4>
         <ul>
           <li><strong>Reference Equality:</strong> Same object in memory (===)</li>
           <li><strong>Object Equality:</strong> Same values in all fields (.equals())</li>
           <li><strong>Behavioral Equality:</strong> Objects behave the same way</li>
         </ul>

         <h4>Equality Contract:</h4>
         <ul>
           <li><strong>Reflexive:</strong> x.equals(x) is true</li>
           <li><strong>Symmetric:</strong> x.equals(y) iff y.equals(x)</li>
           <li><strong>Transitive:</strong> if x.equals(y) and y.equals(z), then x.equals(z)</li>
           <li><strong>Consistent:</strong> Multiple calls return same result</li>
         </ul>

         <h4>Example:</h4>
         <div class="bg-gray-100 p-4 rounded-lg mt-4">
           <pre><code>class Person {
    private String name;
    private int age;
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Person)) return false;
        Person other = (Person) obj;
        return Objects.equals(name, other.name) && age == other.age;
    }
}</code></pre>
         </div>
       `,
      question:
        "Why must hashCode() be overridden when equals() is overridden?",
      correctAnswer:
        "equal objects must have same hash code for hash tables to work correctly",
      hints: [
        "Think about how hash tables work",
        "Consider what happens when equal objects have different hash codes",
        "Hash code contract requires equal objects to have equal hash codes",
      ],
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
         <h3>Recursive Data Types</h3>
         <p>Recursive data types are defined in terms of themselves, enabling elegant solutions for tree-like structures.</p>
         
         <h4>Common Examples:</h4>
         <ul>
           <li><strong>Binary Trees:</strong> Each node has left and right subtrees</li>
           <li><strong>Linked Lists:</strong> Each node points to the next node</li>
           <li><strong>Expression Trees:</strong> Mathematical expressions as trees</li>
         </ul>

         <h4>Key Principles:</h4>
         <ul>
           <li>Base case: Simple, non-recursive case</li>
           <li>Recursive case: References to the same type</li>
           <li>Structural recursion: Process follows data structure</li>
         </ul>
       `,
      question: {
        type: "drag-drop-code",
        question:
          "Arrange the binary tree traversal code in the correct order:",
        codeBlocks: [
          "if (node == null) return;",
          "traverseInOrder(node.left);",
          "System.out.println(node.data);",
          "traverseInOrder(node.right);",
          "public void traverseInOrder(TreeNode node) {",
        ],
        correctOrder: [4, 0, 1, 2, 3],
        explanation:
          "In-order traversal: method signature → null check → left subtree → process node → right subtree",
      } as Question,
    },

    "grammars-parsing": {
      title: "Grammars & Parsing",
      description: "Understanding formal grammars and parsing techniques.",
      content: `
         <h3>Grammars & Parsing</h3>
         <p>Grammars define the syntax of languages, while parsers convert text into structured data.</p>
         
         <h4>Grammar Components:</h4>
         <ul>
           <li><strong>Terminals:</strong> Basic symbols (tokens)</li>
           <li><strong>Non-terminals:</strong> Abstract symbols</li>
           <li><strong>Productions:</strong> Rules for rewriting</li>
           <li><strong>Start symbol:</strong> Root of the grammar</li>
         </ul>

         <h4>Parsing Approaches:</h4>
         <ul>
           <li><strong>Top-down:</strong> Start from root, work to leaves</li>
           <li><strong>Bottom-up:</strong> Start from leaves, build to root</li>
           <li><strong>Recursive descent:</strong> Each non-terminal becomes a method</li>
         </ul>
       `,
      question: {
        type: "multiple-choice",
        question:
          "Which parsing approach matches non-terminals to methods in the parser?",
        options: [
          "Bottom-up parsing",
          "Recursive descent parsing",
          "LR parsing",
          "Shift-reduce parsing",
        ],
        correctAnswer: 1,
        explanation:
          "Recursive descent parsing creates a method for each non-terminal in the grammar.",
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
