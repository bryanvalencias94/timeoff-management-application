# DevOps for Timeoff Magamenet Application

This “devops” folder contains all the Jenkins pipelines, infrastructure as code and configuration management (using Ansible) and pre-requisites to deploy the Timeoff Management Application (https://github.com/bryanvalencias94/timeoff-management-application) in an EC2 virtualization solution.

# Prerequisites

1. Jenkins instance with the following configurations:

- Ansible plugin installed
- Artifactory plugin installed
- Pipeline plugin installed
- Credentials for Artifactory
- Credentials for AWS. Username: AccessKey and Password: SecretKey
- Credentials for Jenkins Agent with Ansible
- Configured connection to Jenkins agent (instance with Ansible installed). For this example, the Jenkins node must be named“ec2-ansible. If you prefer using another name, change it in the Jenkinsfile as well.
- Global tool configuration for NodeJS installation using version 13.7.0. Include node-test in Global npm packages to install. Name it as NodeJS13. If you prefer using another name, change it in the Jenkinsfile as well.
	
	Example:
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/NodeJSGlobalToolJenkins.png?raw=true)

- Global tool configuration for Ansible
	
	Example:
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/AnsibleGlobalToolJenkins.png?raw=true)
- Configure system for Artifactory, using the corresponding credentials and URLs.

	Example:

![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/JFrogConfigJenkins.png?raw=true)
2. Artifactory instance with a repository named "timeoff-management-application".

Example:

![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/ArtifactoryRepository.png?raw=true)

3. Ansible running on a Jenkins node with the community.general collection installed. To install it use:

`ansible-galaxy collection install community.general.`

4. Webhook configured on GitHub in the corresponding repository to the Jenkins URL.

	Example:
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/GitHubWebHook.png?raw=true)

# Architecture diagrams
## 1. DevOps component architecture
Jenkins, Artifactory, and Ansible (Jenkins agent) are installed on EC2 instances for this example. Other installations are also valid, such as using docker.
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/DevOpsComponentArchitecture.png?raw=true)

## 2. DevOps flow diagram
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/DevOpsFlow.png?raw=true)

# Understanding the Jenkins pipeline and Ansible playbooks.
## Jenkins pipeline
The Jenkins pipeline is made up of the following 6 stages:
1.	Git
Fetch the code from the corresponding git branch into the Jenkins agent workspace.

2.	Build
The command “npm install” is executed. Also, a tar.gz file is generated excluding non-necessary files to run the app on the final server.

3.	Test
The command “npm test” is run to execute the test. For this specific example only one test is executed, due to the complete set of test takes a long time to conclude.

4.	Artifact upload
Using the “rtUpload” function of Jenkins, the tar.gz file is uploaded to the Artifactory repository. To achieve this the pattern and target are specified. In this step, the mentioned pre-requisites for Artifactory credentials and system configuration must be completed.

5.	Infrastructure
Using the “ansiblePlaybook” function, the playbook  called “infrastructure_playbook.yml” is run. Note that for this step, the mechanism “withCredentials” is used to pass to Ansible the AWS credentials from a Jenkins credentials object. Then, the AccessKey and SecretKey are passed as “extraVars”.

6.	Configuration management and application deployment
Another playbook is run using the “ansiblePlaybook” function. In this case, the credentials sent to Ansible are the Artifactory credentials, because a task of the “config_management_playbook.yml” needs download the final artifact from Artifactory to run the NodeJS application.
In the first sections of the pipeline, the agent with label “ec2-ansible” is indicated. This ensures that the agent with the Ansible instance is used to run the steps. The tool named “NodeJS13” is also specified to use the specific version of NodeJS in the Jenkins agent.
To clean the workspace on the Jenkins agent once the pipeline is already finished, a post configuration is included.

## Ansible playbooks
### Infrastructure playbook
The infrastructure playbook is used to create the necessary infrastructure to run the Timeoff Management application in a virtualization solution, for this case an EC2 instance in AWS. At first, some variables are indicated to customize the playbook, such as the AWS region, the instance type, the AMI ID, among others.
The following resources are created in AWS in the group of tasks:

**1.	Security group**.
Note that AccessKey and SecretKey are passed as variables from the Jenkins pipeline. It is also important to note that the port 3000 is specifed and allowed to be accessed from any machine, since the NodeJS app uses this port to be exposed.

**2.	Key pair**
These keys are then used to connect to the EC2 instance to configure the server and initialize the application.

**3.	EC2 instance**
The EC2 instance is created using the security group, Key pair and the previous setting indicated as variables.

Then the public  IP of the new EC2 instance is saved in the inventory file. Finally, an SSH connection is made to the EC2 instance to check its operation.
## Configuration management playbook
Once the EC2 instance is created it is time to prepare it to be able to run the NodeJS application. This playbook is composed of 17 tasks:
-	In the first task, some base packages are installed in the new machine, using the “yum tool".
-	The next 15 tasks install NodeJS and npm and set some environment variables. To run this application successfully on an Amazon Linux instance, was necessary to install the specific version 13.7.0, otherwise the app crashes when it tries to start. Due to version 13.7.0 is not an LTS version, the short way to install NodeJS it is not used.
-	In the next task, the pm2 tool is installed. Pm2 allows running the NodeJS application as a daemon on the server.
-	Next, a directory is created to store the application, then the tar.gz file is downloaded from Artifactory (note that the Artifactory credentials from Jenkins are used) and it is extracted in the corresponding directory.
-	The last task runs the Timeoff Management application using pm2.

# Steps to deploy the application using the proposed strategy.
1.	Create a pipeline in Jenkins and configure it to use pipeline script from SCM. Set the git repository and the path for the Jenkinsfile (relative path in the git repository). For this specific example and repository, these are the values:

![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/JenkinsPipeline1.png?raw=true)
![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/JenkinsPipeline2.png?raw=true)

Also choose the “GitHub hook trigger for GITScm polling” in the “Build triggers” section. This will trigger the pipeline every time there is a change to the master branch.

2.	It is possible to execute the pipeline using the “Build Now” option, or you can push a change in the master branch to run the pipeline.

3.	Check that a new build ID is created, and all its stages are executed successfully.

![](https://github.com/bryanvalencias94/timeoff-management-application/blob/master/devops/images/BuildCreatedJenkins.png?raw=true)

4.	You can use the public IP of the EC2 instance and port 3000 to open the application through the browser.




