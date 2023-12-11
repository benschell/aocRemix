import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 10;
const dayStr = `${dayNum}`.padStart(2, '0');
const slug = `2023.${dayStr}`;
const name = `Day ${dayStr}`;

export async function loader({}: LoaderFunctionArgs) {
  const __dirname = getDirname();
  const inputs = await fs.readdir(`${__dirname}/../app/routes/${slug}/inputs`);
  return json({
    inputs
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: name},
    { name: "description", content: name },
  ];
};

export default function Day00() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() || {output: '', rawInput: ''};
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto">
      <h1>{name} <Link to={`https://adventofcode.com/2023/day/${dayNum}`} className="text-lg text-blue-600 hover:underline">Puzzle</Link></h1>

      <h2>Input:</h2>
      <Form method="post" className="flex max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="selected-input" value="Available File Inputs:" />
          </div>
          <Select name="selected-input">
            {data.inputs.map((input, index) => (
              <option key={`option-${index}`}>{input}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="raw-input" value="Raw Text Input:" />
          </div>
          <Textarea className="font-mono" name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea className="font-mono" id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea className="font-mono" id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }
  const lines = rawInput.split('\n');

  type Coord = {
    x: number;
    y: number;
  }
  type CoordWithLast = Coord & {
    lastNode: MapNode;
  };
  type MapNode = Coord & {
    type: string;
    steps: number;

    left?: MapNode;
    right?: MapNode;
    up?: MapNode;
    down?: MapNode;
  }
  // First index = y, incrementing from top to bottom
  // Second index = x, incrementing from left to right
  const map: MapNode[][] = [];
  let start: MapNode | undefined;

  lines.forEach((line, lineIdx) => {
    if (!map[lineIdx]) {
      map[lineIdx] = [];
    }
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const node = {
        type: line[charIdx],
        x: charIdx,
        y: lineIdx,
        steps: 0
      };
      map[lineIdx].push(node);

      if (node.type === 'S') {
        start = node;
      }
    }
  });

  if (!start) {
    output.push(`Starting point not found :(`);
    return json({ ok: true, rawInput, output: output.join('\n') });
  }

  output.push(`Parsed map, start is at: ${start.x},${start.y}`);
  output.push(...map.map((row) => row.reduce((existingVal, node) => existingVal + node.type, '')))

  let cycleLength = 0;
  const traverse: (coord: CoordWithLast) => CoordWithLast | undefined = (coord) => {
    const x = coord.x,
          y = coord.y,
          lastNode = coord.lastNode;

    if (cycleLength) {
      // Bail out if we've found a cycle
      output.push(`Maybe we have a cycle?`);
      return;
    }
    // From this current position, recurse to the next possible location based on this node's type
    if (y >= map.length || y < 0) {
      // Y is out of bounds, leave
      return;
    }
    if (x >= map[y].length || x < 0) {
      // X is out of bounds, leave
      return;
    }
    const node = map[y][x];
    if (node.type === '.') {
      // This pipe empties into ground. We are done with this traversal
      return;
    }
    if (node.type === 'S') {
      // Starting position! We're done.
      cycleLength = (lastNode.steps + 1) / 2;
      output.push(`Found Starting position! ${cycleLength}`);
      return { x, y, lastNode: node };
    }
    output.push(`Visiting: ${x},${y}`);
    const currentSteps = lastNode.steps + 1;
    if (node.steps > 0) {
      // This node has been visited. Ultimately we will leave it.
      // If the last way of visiting this node was longer than this current visit, we should update the number of steps
      if (node.steps > currentSteps) {
        output.push(`Found a node with higher steps (${node.steps}) than current steps (${currentSteps})`);
        node.steps = currentSteps;
      }
      output.push(`Returning due to ${node.steps}`);
      return;
    }

    // If this node has the exact same number of steps, we *may* have the cycle
    if (node.steps === currentSteps) {
      output.push(`Found a possible end of the cycle? ${currentSteps} at ${node.x},${node.y}`);
      cycleLength = currentSteps;
    }

    node.steps = lastNode.steps + 1;

    // Figure out which way to go based on node.type and lastNode
    // TODO:
    if (node.type === '|') {
      output.push(`Vertical pipe`);
      // Is lastNode Down?
      if (lastNode.y > y) {
        // lastNode is Down, so go Up
        return { x , y: y-1 , lastNode: node };
        // traverse(x, y-1, node);
      } else if (lastNode.y < y) {
        // lastNode is Up, so go Down
        return { x , y: y+1 , lastNode: node };
        // traverse(x, y+1, node);
      }
    } else if (node.type === '-') {
      output.push(`Horizontal pipe ${lastNode.x} vs ${x}`);
      // Is lastNode Right?
      if (lastNode.x > x) {
        // lastNode is Right, so go Left
        return { x: x-1 , y , lastNode: node };
        // traverse(x-1, y, node);
      } else if (lastNode.x < x) {
        // lastNode is Left, so go Right
        return { x: x+1 , y , lastNode: node };
        // traverse(x+1, y, node);
      }
    } else if (node.type === 'L') {
      output.push(`L`);
      // Is lastNode Up?
      if (lastNode.y < y) {
        output.push(`Last node is Up`);
        // lastNode is Up, so go Right
        return { x: x+1 , y , lastNode: node };
        // traverse(x+1, y, node);
      } else if (lastNode.x > x) {
        output.push(`Last node is Right`);
        // lastNode is Right, so go Up
        return { x , y: y-1 , lastNode: node };
        // traverse(x, y-1, node);
      }
    } else if (node.type === 'J') {
      output.push(`J`);
      // Is lastNode Up?
      if (lastNode.y < y) {
        // lastNode is Up, so go Left
        return { x: x-1 , y , lastNode: node };
        // traverse(x-1, y, node);
      } else if(lastNode.x < x) {
        // lastNode is Left, so go Up
        return { x , y: y-1 , lastNode: node };
        // traverse(x, y-1, node);
      }
    } else if (node.type === '7') {
      output.push(`7`);
      // Is lastNode Down?
      if (lastNode.y > y) {
        // lastNode is Down, so go Left
        return { x: x-1 , y , lastNode: node };
        // traverse(x-1, y, node);
      } else if (lastNode.x < x) {
        // lastNode is Left, so go Down
        return { x , y: y+1 , lastNode: node };
        // traverse(x, y+1, node);
      }
    } else if (node.type === 'F') {
      output.push(`F`);
      // Is lastNode Down?
      if (lastNode.y > y) {
        // lastNode is Down, so go Right
        return { x: x+1 , y , lastNode: node };
        // traverse(x+1, y, node);
      } else if (lastNode.x > x) {
        // lastNode is Right, so go Down
        return { x , y: y+1 , lastNode: node };
        // traverse(x, y+1, node);
      }
    } else {
      // Ground OR Start; return
      return;
    }
  }

  // Go Up first
  let nextCoord: CoordWithLast | undefined;
  output.push(`==== ==== ==== TRYING UP!`)
  nextCoord = { x: start.x, y: start.y - 1, lastNode: start };
  let count = 0;
  let redo = true;
  while (true) {
    const lastCoord = nextCoord;
    nextCoord = traverse(nextCoord);
    if (!nextCoord) {
      // Got an exit condition. Stop
      break;
    }
    if (lastCoord.x == nextCoord.x && lastCoord.y == nextCoord.y) {
      // Found the cycle. Don't redo
      redo = false;
      break;
    }
  }
  // traverse(start.x, start.y-1, start);
  if (redo) {
    // Reset all steps
    for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
      for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
        map[rowIdx][colIdx].steps = 0;
      }
    }
    // Right
    output.push(`==== ==== ==== TRYING RIGHT!`)
    nextCoord = { x: start.x+1, y: start.y, lastNode: start };
    count = 0;
    while (true) {
      nextCoord = traverse(nextCoord)
      if (!nextCoord) {
        // Got an exit condition. Stop
        break;
      }
    }
  }
  // Part 1: 
  // 6875 was right
  
  // One of the part 2 test cases needs me to try starting on the left also
  if (redo) {
    // Reset all steps
    for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
      for (let colIdx = 0; colIdx < map[rowIdx].length; colIdx++) {
        map[rowIdx][colIdx].steps = 0;
      }
    }
    // Left
    output.push(`==== ==== ==== TRYING LEFT!`)
    nextCoord = { x: start.x-1, y: start.y, lastNode: start };
    count = 0;
    while (true) {
      nextCoord = traverse(nextCoord)
      if (!nextCoord) {
        // Got an exit condition. Stop
        break;
      }
    }
  }

  if (cycleLength === 0) {
    // Never found a cycle
    output.push(`=== === === === NEVER FOUND A CYCLE === === === ===`);
    return json({ ok: true, rawInput, output: output.join('\n') });
  }

  // Figure out what type of node the start node is
  let candidates = [];
  // Look left:
  if (start.x - 1 >= 0 && (map[start.y][start.x-1].type === '-' || map[start.y][start.x-1].type === 'F' || map[start.y][start.x-1].type === 'L')) {
    // S has something coming in from the left
    // If the one above is a | or F or 7, then this is a J
    if (start.y - 1 >= 0 && (map[start.y-1][start.x].type === '|' || map[start.y-1][start.x].type === 'F' || map[start.y-1][start.x].type === '7')) {
      start.type = 'J';
    }
    // If the one below is a | or J or L, then this is a 7
    if (start.y + 1 < map.length && (map[start.y+1][start.x].type === '|' || map[start.y+1][start.x].type === 'J' || map[start.y+1][start.x].type === 'L')) {
      start.type = '7';
    }
    // If the one to the right is a - or J or 7, then this is a -
    if (start.x + 1 < map[start.y].length && (map[start.y][start.x+1].type === '-' || map[start.y][start.x+1].type === 'J' || map[start.y][start.x+1].type === '7')) {
      start.type = '-';
    }
  } else if (start.x + 1 < map[start.y].length && (map[start.y][start.x+1].type === '-' || map[start.y][start.x+1].type === 'J' || map[start.y][start.x+1].type === '7')) {
    // S has something coming in from the right
    // If the one above is a | or F or 7, then this is a L
    if (start.y - 1 >= 0 && (map[start.y-1][start.x].type === '|' || map[start.y-1][start.x].type === 'F' || map[start.y-1][start.x].type === '7')) {
      start.type = 'L';
    }
    // If the one below is a | or J or L, then this is a F
    if (start.y + 1 < map.length && (map[start.y+1][start.x].type === '|' || map[start.y+1][start.x].type === 'J' || map[start.y+1][start.x].type === 'L')) {
      start.type = 'F';
    }
    // If the one to the left is a - or F or L, then this is a -
    if (start.x - 1 >= 0 && (map[start.y][start.x-1].type === '-' || map[start.y][start.x-1].type === 'F' || map[start.y][start.x-1].type === 'L')) {
      start.type = '-';
    }
  } else if (start.y - 1 >= 0 && (map[start.y-1][start.x].type === '|' || map[start.y-1][start.x].type === 'F' || map[start.y-1][start.x].type === '7')) {
    // S has something coming in from the top
    // If the one left is a - or F or L, then this is a J
    if (start.x - 1 >= 0 && (map[start.y][start.x-1].type === '-' || map[start.y][start.x-1].type === 'F' || map[start.y][start.x-1].type === 'L')) {
      start.type = 'J';
    }
    // If the one below is a | or J or L, then this is a |
    if (start.y + 1 < map.length && (map[start.y+1][start.x].type === '|' || map[start.y+1][start.x].type === 'J' || map[start.y+1][start.x].type === 'L')) {
      start.type = '|';
    }
    // If the one to the right is a - or J or 7, then this is a L
    if (start.x + 1 < map[start.y].length && (map[start.y][start.x+1].type === '-' || map[start.y][start.x+1].type === 'J' || map[start.y][start.x+1].type === '7')) {
      start.type = 'L';
    }
  } else if (start.y + 1 < map.length && (map[start.y+1][start.x].type === '|' || map[start.y+1][start.x].type === 'L' || map[start.y+1][start.x].type === 'J')) {
    // S has something coming in from the bottom
    // If the one left is a - or F or L, then this is a 7
    if (start.x - 1 >= 0 && (map[start.y][start.x-1].type === '-' || map[start.y][start.x-1].type === 'F' || map[start.y][start.x-1].type === 'L')) {
      start.type = '7';
    }
    // If the one above is a | or F or 7, then this is a |
    if (start.y + 1 < map.length && (map[start.y+1][start.x].type === '|' || map[start.y+1][start.x].type === 'F' || map[start.y+1][start.x].type === '7')) {
      start.type = '|';
    }
    // If the one to the right is a - or J or 7, then this is a F
    if (start.x + 1 < map[start.y].length && (map[start.y][start.x+1].type === '-' || map[start.y][start.x+1].type === 'J' || map[start.y][start.x+1].type === '7')) {
      start.type = 'L';
    }
  }
  start.steps = -1;
  output.unshift(`Re-assigned start to ${start.type}`);

  output.push(`==== ==== ==== ==== Iterating over map to count contained spaces`);
  // Part 2:
  // Iterate over the rows
  // For each row, count the number of cells where the number of encountered pipe segments (those with a steps > 0 || type == 'S') is odd
  let numInnerParts = 0;
  for (let rowIdx = 0; rowIdx < map.length; rowIdx++) {
    const row = map[rowIdx];
    let numPipesEncountered = 0;
    let inHorizontalPipe = false;
    let horizontalPipeStartType: string = '.';
    // let insideCycle = false;
    row.forEach((node, colIdx) => {

      // If this is a part of our loop, increment numPipesEncountered
      if (node.steps !== 0) {
        // DISREGARD HORIZONTAL PIPES in incrementing
        if (
          node.type === 'F' || 
          node.type === 'J' || 
          node.type === '7' || 
          node.type === 'L'
        ) {
          // This is a junction that starts or ends a horizontal pipe.
          // If we're not in a horizontal pipe, we need to start the horizontal pipe (and not increment)
          // If we are in a horizontal pipe, then we need to end the pipe and increment
          //   ONLY INCREMENT IF WE EXIT FROM THE OPPOSITE SIDE THAT WE ENTERED
          if (!inHorizontalPipe) {
            // Starting a horizontal pipe
            inHorizontalPipe = true;
            horizontalPipeStartType = node.type;
            output.push(`Starting a horizontal pipe at ${colIdx+1},${rowIdx+1}, numPipesEncountered: ${numPipesEncountered}`);
            // if (insideCycle) {
            //   insideCycle = !insideCycle;
            // }
            // output.push(`Starting a horizontal pipe at ${colIdx+1},${rowIdx+1}, insideCycle now = ${insideCycle}`);
          } else {
            // Ending a horizontal pipe
            inHorizontalPipe = false;
            // Increment IFF the (vertical) exit is opposite that of the way it entered
            if (
              (horizontalPipeStartType === 'F' && node.type === 'J') ||
              (horizontalPipeStartType === '7' && node.type === 'L') ||
              (horizontalPipeStartType === 'L' && node.type === '7') ||
              (horizontalPipeStartType === 'J' && node.type === 'F')
            ) {
              // The pipe exited (vertically) opposite the start
              numPipesEncountered += 1;
            }
            output.push(`Ending a horizontal pipe at ${colIdx+1},${rowIdx+1}, numPipesEncountered: ${numPipesEncountered}`);
            // insideCycle = !insideCycle;
            // output.push(`Ending a horizontal pipe at ${colIdx+1},${rowIdx+1}, insideCycle now = ${insideCycle}`);
          }
        } else if (node.type === '|') {
          // This is a | or a S
          // Simply increment
          numPipesEncountered += 1;
          output.push(`Encountered a | or S at ${colIdx+1},${rowIdx+1}, numPipesEncountered: ${numPipesEncountered}`);
          // insideCycle = !insideCycle;
          // output.push(`Encountered a | or S at ${colIdx+1},${rowIdx+1}, insideCycle now = ${insideCycle}`);
        } else if (node.type === '-') {
          // This is a -
          // Do nothing
        }
      } else {
        // Not a pipe that is part of our set. So, if numPipesEncountered is odd, it is an inner part
        // if (insideCycle) {
        if (numPipesEncountered % 2 === 1) {
          output.push(`Found inner part at ${colIdx+1},${rowIdx+1}`);
          map[rowIdx][colIdx].type = '@';
          numInnerParts++;
        } else {
          output.push(`Not counting ${colIdx+1},${rowIdx+1} as numPipesEncountered is even`);
        }
      }
    });
    output.push('==== ==== ==== ');
  }
  output.push(`Num Inner Parts: ${numInnerParts}`);
  output.push(...map.map((row) => row.reduce((existingVal, node) => existingVal + node.type, '')))

  return json({ ok: true, rawInput, output: output.join('\n') });
}