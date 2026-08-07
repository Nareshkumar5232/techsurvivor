import type { CodingProblem, MCQQuestion, SupportedLanguage } from "@tech-survivor/types";
import { DEFAULT_STARTER_CODE, ROUND2_DEFAULT_POINTS } from "@tech-survivor/config";

export const SEED_EVENT_ID = "main";
export const SEED_PASSWORD = "TechSurvivor@2026";

interface SeedMcqInput {
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

const RAW_QUESTIONS: SeedMcqInput[] = [
  { question: "Which format specifier prints a float value in C?", options: ["%d", "%f", "%s", "%c"], correctOptionIndex: 1, category: "C Programming", difficulty: "easy" },
  { question: "What is the size of an `int` on a typical 32-bit C compiler?", options: ["2 bytes", "4 bytes", "8 bytes", "1 byte"], correctOptionIndex: 1, category: "C Programming", difficulty: "easy" },
  { question: "Which operator accesses the value pointed to by a pointer variable in C?", options: ["&", "*", "->", "."], correctOptionIndex: 1, category: "C Programming", difficulty: "easy" },
  { question: "Which data structure follows Last In, First Out (LIFO) order?", options: ["Queue", "Stack", "Linked List", "Tree"], correctOptionIndex: 1, category: "Data Structures", difficulty: "easy" },
  { question: "What is the average-case time complexity of searching in a balanced binary search tree?", options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"], correctOptionIndex: 2, category: "Data Structures", difficulty: "medium" },
  { question: "Which binary tree traversal visits nodes in left, root, right order?", options: ["Preorder", "Inorder", "Postorder", "Level order"], correctOptionIndex: 1, category: "Data Structures", difficulty: "medium" },
  { question: "What is the average-case time complexity of quicksort?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], correctOptionIndex: 1, category: "Algorithms", difficulty: "medium" },
  { question: "Which algorithm finds the shortest path in a weighted graph with non-negative edge weights?", options: ["DFS", "BFS", "Dijkstra's algorithm", "Bubble sort"], correctOptionIndex: 2, category: "Algorithms", difficulty: "medium" },
  { question: "Merge sort is a classic example of which algorithmic paradigm?", options: ["Greedy", "Dynamic Programming", "Divide and Conquer", "Backtracking"], correctOptionIndex: 2, category: "Algorithms", difficulty: "medium" },
  { question: "Which normal form removes transitive dependency on the primary key?", options: ["1NF", "2NF", "3NF", "BCNF"], correctOptionIndex: 2, category: "DBMS", difficulty: "medium" },
  { question: "Which SQL clause filters groups after a GROUP BY aggregation?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], correctOptionIndex: 1, category: "DBMS", difficulty: "medium" },
  { question: "Which key uniquely identifies a record in a database table?", options: ["Foreign Key", "Candidate Key", "Primary Key", "Composite Key"], correctOptionIndex: 2, category: "DBMS", difficulty: "easy" },
  { question: "Which of the following is a non-preemptive CPU scheduling algorithm?", options: ["Round Robin", "First Come First Served", "Preemptive Priority", "SRTF"], correctOptionIndex: 1, category: "Operating Systems", difficulty: "medium" },
  { question: "What is a deadlock in an operating system?", options: ["A process using excessive memory", "Two or more processes waiting indefinitely for each other's resources", "A process finishing early", "A CPU running at full utilization"], correctOptionIndex: 1, category: "Operating Systems", difficulty: "medium" },
  { question: "Which memory management technique divides physical memory into fixed-size blocks?", options: ["Paging", "Segmentation", "Fragmentation", "Swapping"], correctOptionIndex: 0, category: "Operating Systems", difficulty: "medium" },
  { question: "Which OSI layer is primarily responsible for routing packets between networks?", options: ["Data Link Layer", "Network Layer", "Transport Layer", "Application Layer"], correctOptionIndex: 1, category: "Computer Networks", difficulty: "medium" },
  { question: "Which protocol resolves a domain name to an IP address?", options: ["FTP", "DNS", "SMTP", "HTTP"], correctOptionIndex: 1, category: "Computer Networks", difficulty: "easy" },
  { question: "Which logic gate outputs true only when both of its inputs are true?", options: ["OR", "AND", "NOR", "XOR"], correctOptionIndex: 1, category: "Basic Electronics", difficulty: "easy" },
  { question: "What does LED stand for?", options: ["Light Emitting Diode", "Low Energy Device", "Linear Electronic Display", "Light Enhanced Diode"], correctOptionIndex: 0, category: "Basic Electronics", difficulty: "easy" },
  { question: "A train travels 60 km in 45 minutes. What is its speed in km/h?", options: ["60", "80", "90", "75"], correctOptionIndex: 1, category: "Aptitude", difficulty: "medium" },
];

export function buildMcqQuestions(now: string): MCQQuestion[] {
  return RAW_QUESTIONS.map((q, index) => ({
    id: `seed-mcq-${index + 1}`,
    eventId: SEED_EVENT_ID,
    question: q.question,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    marks: 1,
    negativeMarks: 0,
    explanation: "",
    category: q.category,
    difficulty: q.difficulty,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
}

function testCase(id: string, input: string, expectedOutput: string, explanation?: string) {
  return explanation === undefined ? { id, input, expectedOutput } : { id, input, expectedOutput, explanation };
}

export function buildCodingProblems(now: string): CodingProblem[] {
  const common = {
    eventId: SEED_EVENT_ID,
    starterCode: DEFAULT_STARTER_CODE,
    supportedLanguages: ["c", "cpp", "python", "java", "javascript", "typescript"] as SupportedLanguage[],
    scoringMode: "partial" as const,
    comparisonMode: "trimmed" as const,
    floatTolerance: 0.000001,
    timeLimit: 2,
    memoryLimit: 256,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const easy: CodingProblem = {
    ...common,
    id: "seed-easy-shortest-completing-word",
    title: "Shortest Completing Word",
    slug: "shortest-completing-word",
    difficulty: "easy",
    description:
      "You are given a license plate and a list of words. A word is a completing word for the " +
      "license plate if, for every letter in the license plate (ignoring numbers and spaces, and " +
      "treating upper/lower case as the same letter), the word contains that letter at least as " +
      "many times as it appears on the license plate. Print the shortest completing word. If " +
      "several words are tied for shortest, print the one that appears first in the list.",
    inputFormat:
      "The first line contains the license plate string (letters, digits, and spaces). The second " +
      "line contains an integer n, the number of words. The third line contains n space-separated " +
      "lowercase words.",
    outputFormat: "The shortest completing word.",
    constraints: "1 <= licensePlate.length <= 7\n1 <= n <= 1000\n1 <= words[i].length <= 15",
    samples: [
      testCase(
        "s1",
        "1s3 PSt\n4\nstep steps stripe stepple",
        "steps",
        "Ignoring digits/spaces, the plate needs s, p, s, t. \"steps\" has two s's, one p, one t and is the shortest word that qualifies.",
      ),
      testCase(
        "s2",
        "1s3 456\n4\nlooks pest stew show",
        "pest",
        "The plate only requires the letter s. \"pest\" is the shortest word containing an s.",
      ),
    ],
    hiddenTestCases: [
      testCase(
        "h1",
        "Ah71752\n10\nsuggest letter of husband easy education drug prevent writer old",
        "husband",
      ),
      testCase(
        "h2",
        "OgEu755\n10\nenough these play wide wonder box arrive money tax thus",
        "enough",
      ),
      testCase("h3", "AAA\n3\naaa aa aaaa", "aaa", "The plate needs the letter a three times; \"aa\" falls short."),
      testCase("h4", "1B 2A\n5\nab ba a b aabb", "ab", "\"ab\" and \"ba\" tie for shortest - the first one in the list wins."),
      testCase("h5", "42\n3\na b c", "a", "A plate with no letters is satisfied by any word - the first (shortest) one wins."),
    ],
    points: ROUND2_DEFAULT_POINTS.easy,
  };

  const medium: CodingProblem = {
    ...common,
    id: "seed-medium-optimal-division",
    title: "Optimal Division",
    slug: "optimal-division",
    difficulty: "medium",
    description:
      "You are given a list of positive integers. Insert a '/' between every pair of adjacent " +
      "numbers, and optionally wrap any contiguous group in parentheses, to build a division " +
      "expression. Print an expression (with the fewest parentheses needed) that maximizes the " +
      "value of the result. It can be shown the optimal expression always keeps the first number " +
      "as the sole numerator and groups everything else into one denominator.",
    inputFormat:
      "The first line contains an integer n. The second line contains n space-separated integers.",
    outputFormat:
      "The optimal division expression as a string with no spaces, e.g. \"1000/(100/10/2)\". " +
      "If n is 1, print just that number. If n is 2, print \"a/b\" with no parentheses.",
    constraints: "1 <= n <= 10\n2 <= nums[i] <= 1000",
    samples: [
      testCase(
        "s1",
        "4\n1000 100 10 2",
        "1000/(100/10/2)",
        "Grouping everything after the first number into one denominator maximizes the value (200).",
      ),
      testCase("s2", "3\n2 3 4", "2/(3/4)"),
    ],
    hiddenTestCases: [
      testCase("h1", "1\n2", "2"),
      testCase("h2", "2\n100 20", "100/20"),
      testCase("h3", "5\n5 4 3 2 1", "5/(4/3/2/1)"),
      testCase("h4", "3\n1000 1000 1000", "1000/(1000/1000)"),
      testCase("h5", "5\n2 2 2 2 2", "2/(2/2/2/2)"),
    ],
    points: ROUND2_DEFAULT_POINTS.medium,
  };

  const hard: CodingProblem = {
    ...common,
    id: "seed-hard-substring-concatenation",
    title: "Substring with Concatenation of All Words",
    slug: "substring-with-concatenation-of-all-words",
    difficulty: "hard",
    description:
      "You are given a string s and a list of words, all of the same length. Find every starting " +
      "index in s where a substring is a concatenation of every word in the list exactly once, in " +
      "any order, with no characters in between. Print the starting indices (0-indexed) in " +
      "ascending order, space-separated. If there are none, print NONE.",
    inputFormat:
      "The first line contains the string s. The second line contains an integer k, the number of " +
      "words. The third line contains k space-separated words, all of equal length.",
    outputFormat: "The matching starting indices in ascending order, space-separated, or NONE.",
    constraints:
      "1 <= s.length <= 10^4\n1 <= k <= 5000\n1 <= words[i].length <= 30\nAll words have the same length.",
    samples: [
      testCase(
        "s1",
        "barfoothefoobarman\n2\nfoo bar",
        "0 9",
        "s[0:6] = \"barfoo\" and s[9:15] = \"foobar\" are both concatenations of \"foo\" and \"bar\".",
      ),
      testCase(
        "s2",
        "wordgoodgoodgoodbestword\n4\nword good best word",
        "NONE",
        "No 16-character window uses \"word\" exactly twice and \"good\"/\"best\" once each.",
      ),
    ],
    hiddenTestCases: [
      testCase("h1", "barfoofoobarthefoobarman\n3\nbar foo the", "6 9 12"),
      testCase("h2", "aaaaaaaaaaaaaa\n2\naa aa", "0 1 2 3 4 5 6 7 8 9 10", "Overlapping windows all qualify when every word is identical."),
      testCase("h3", "abcdef\n2\nxy zt", "NONE"),
      testCase(
        "h4",
        "lingmindraboofooowingdingbarrwingmonkeypoundcake\n5\nfooo barr wing ding wing",
        "13",
        "The word list contains \"wing\" twice, so a matching window must use it twice too.",
      ),
      testCase("h5", "a\n1\na", "0"),
    ],
    points: ROUND2_DEFAULT_POINTS.hard,
  };

  return [easy, medium, hard];
}
