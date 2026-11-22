import math
import json
import re
from pathlib import Path
from script import SCENES

values = {'rule72_years': 72/12, 'exponential_solution_years': math.log(2)/math.log(1.12),
          'after_6_years': 100*1.12**6, 'after_7_years': 100*1.12**7,
          'first_annual_credit_at_or_above_200': math.ceil(math.log(2)/math.log(1.12))}
assert round(values['after_6_years'], 2) == 197.38
assert round(values['after_7_years'], 2) == 221.07
assert values['first_annual_credit_at_or_above_200'] == 7
values['spoken_word_count'] = len(re.findall(r'\S+', ' '.join(text for _, lines in SCENES for _, text in lines)))
assert 100 <= values['spoken_word_count'] <= 120
print(json.dumps(values, ensure_ascii=False, indent=2))
